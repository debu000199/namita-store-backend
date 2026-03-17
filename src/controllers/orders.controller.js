import redis from '../config/redis.config.js';
import ordersModel from '../models/orders.model.js';
import ProductVariant from '../models/productVariant.model.js';
import User from '../models/user.model.js';

/**
 * Create a new order for the authenticated user
 * Request body:
 * {
 *   items: [{ variantId: "...", quantity: 2 }, ...],
 *   address: { fullname, phone, line1, city, state, postalCode, line2? }
 * }
 * address may also be an array of such objects; internally it'll be wrapped
 * One order can have multiple items (variants), each with its own quantity
 */
export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    const userId = req.user?._id; // Assumes middleware attaches user to req

    // Validate input
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // items must be a non‑empty array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Items array is required with at least one item',
      });
    }

    // address may be provided as an object or an array of objects
    if (
      !shippingAddress ||
      (typeof shippingAddress !== 'object' && !Array.isArray(shippingAddress))
    ) {
      return res.status(400).json({
        message: 'Address object or array is required',
      });
    }
    const addressArray = Array.isArray(shippingAddress)
      ? shippingAddress
      : [shippingAddress];
    if (addressArray.length === 0) {
      return res.status(400).json({
        message: 'Address array must contain at least one address',
      });
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.variantId || !item.quantity || item.quantity < 1) {
        return res.status(400).json({
          message: 'Each item must have variantId and quantity (min 1)',
        });
      }
    }

    // Validate address objects have required properties
    const requiredAddrFields = [
      'fullname',
      'phone',
      'line1',
      'city',
      'state',
      'postalCode',
    ];
    for (const addr of addressArray) {
      for (const field of requiredAddrFields) {
        if (!addr[field]) {
          return res.status(400).json({
            message: `Address must include ${field}`,
          });
        }
      }
    }

    // Fetch all variants and validate stock
    const variantIds = items.map(item => item.variantId);
    const variants = await ProductVariant.find({ _id: { $in: variantIds } });

    if (variants.length !== items.length) {
      return res
        .status(404)
        .json({ message: 'One or more variants not found' });
    }

    // Create a map of variant ID to variant object for quick lookup
    const variantMap = new Map(variants.map(v => [v._id.toString(), v]));

    // Validate stock and construct order items
    const orderItems = [];
    let totalPrice = 0;

    // Order address
    const customerAddress = addressArray.map(addr => ({
      fullname: addr.fullname,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
    }));

    for (const item of items) {
      const variant = variantMap.get(item.variantId);

      if (!variant) {
        return res.status(404).json({
          message: `Variant ${item.variantId} not found`,
        });
      }

      if (variant.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${variant.name}. Available: ${variant.stock}, Requested: ${item.quantity}`,
        });
      }

      const itemTotal = variant.price * item.quantity;
      orderItems.push({
        variant: variant._id,
        quantity: item.quantity,
        price: itemTotal,
      });

      totalPrice += itemTotal;
    }

    // Create the order
    const newOrder = await ordersModel.create({
      user: userId,
      items: orderItems,
      total: totalPrice,
      currency: variants[0]?.currency || 'INR', // Get currency from first variant
      status: 'pending',
      address: customerAddress,
    });

    // Update user's orders array
    await User.findByIdAndUpdate(userId, {
      $push: { orders: newOrder._id },
    });

    // Deduct stock from variants
    await Promise.all(
      items.map(item =>
        ProductVariant.findByIdAndUpdate(item.variantId, {
          $inc: { stock: -item.quantity },
        })
      )
    );

    // Populate order details before returning
    const populatedOrder = await ordersModel
      .findById(newOrder._id)
      .populate('user', 'name email')
      .populate({
        path: 'items.variant',
        select: 'name price product',
        populate: {
          path: 'product',
          select: 'title',
        },
      });

    /*
     CACHE INVALIDATION SECTION
   */

    if (redis) {
      const pattern = `orders:user:${userId.toString()}:*`;

      let cursor = '0';

      do {
        const result = await redis.scan(cursor, {
          match: pattern,
          count: 100,
        });

        cursor = result[0];
        const keys = result[1];

        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');
    }

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: populatedOrder,
    });
  } catch (error) {
    console.error('Error while creating order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
    });
  }
};

/**
 * Fetch orders for the authenticated user
 * Query params: page, limit (default: page=1, limit=50)
 */
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { page = 1, limit = 50 } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const cacheKey = `orders:user:${userId.toString()}:page:${parsedPage}:limit:${parsedLimit}`;

    if (redis) {
      const cachedOrders = await redis.get(cacheKey);

      if (cachedOrders) {
        return res.status(200).json(cachedOrders);
      }
    }

    const [userOrders, total] = await Promise.all([
      ordersModel
        .find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate({
          path: 'items.variant',
          select: 'name price product',
          populate: {
            path: 'product',
            select: 'title',
          },
        })
        .lean(),
      ordersModel.countDocuments({ user: userId }),
    ]);

    if (userOrders.length === 0) {
      return res.status(404).json({ message: 'No orders found' });
    }

    const response = {
      message: 'User orders fetched successfully',
      orders: userOrders,
      meta: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit) || 0,
      },
    };

    if (redis) {
      await redis.set(cacheKey, response, { ex: 120 }); // cache 2 minutes
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error while fetching user orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
};
