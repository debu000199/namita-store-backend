import ordersModel from '../../models/orders.model.js';

// TODO: Get the product id from body not params

// fetch all orders along with user, variant (and product) details
export const orders = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100); // 1..100
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const [getOrders, total] = await Promise.all([
      ordersModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate('user', 'name')
        .populate({
          path: 'items.variant',
          select: 'name price product',
          populate: {
            path: 'product',
            select: 'title',
          },
        })
        .lean(),
      ordersModel.countDocuments(),
    ]);

    if (!getOrders || getOrders.length === 0) {
      return res.status(404).json({ message: 'No orders found' });
    }

    return res.status(200).json({
      message: 'Orders fetched successfully',
      orders: getOrders,
      meta: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit) || 0,
      },
    });
  } catch (error) {
    console.error('Error happen while get the all orders: ', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const orderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res
        .status(401)
        .json({ message: 'Please provide an valid orderId' });
    }

    const order = await ordersModel
      .findById(orderId)
      .populate('user', 'name')
      .populate({
        path: 'items.variant',
        select: 'name price product ',
        populate: {
          path: 'product',
          select: 'title',
        },
      })
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'No order found' });
    }

    res.status(200).json({
      message: 'Successfully fetch the order details',
      orders: order,
    });
  } catch (error) {
    console.error('Error while view orders by Id: ', error);
    return res.status;
  }
};

export const updateOrderStatusById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Please provide an order id' });
    }

    if (typeof status === 'undefined') {
      return res.status(400).json({ message: 'Please provide a status value' });
    }

    // use update object and return the updated document
    const order = await ordersModel.findByIdAndUpdate(orderId, { status });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res
      .status(200)
      .json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Error while updating the order status: ', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
