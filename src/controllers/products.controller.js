import redis from '../config/redis.config.js';
import Category from '../models/catagories.model.js';
import Product from '../models/product.model.js';

// Return all Products to User
export const products = async (req, res) => {
  try {
    const { page = 1, limit = 50, category } = req.query;

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    // SAFE CACHE KEY
    const cacheKey = `products:page:${parsedPage}:limit:${parsedLimit}:category:${category || 'all'}`;

    // CHECK CACHE
    if (redis) {
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        return res.status(200).json(cachedData);
      }
    }

    const query = {};

    // CATEGORY FILTER
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });

      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    const [getProducts, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate('variants', 'name price')
        .populate('category', 'name')
        .lean(),

      Product.countDocuments(query),
    ]);

    if (!getProducts || getProducts.length === 0) {
      return res.status(404).json({ message: 'No Product Found' });
    }

    const response = {
      message: 'Product fetch successfully',
      products: getProducts,
      meta: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPage: Math.ceil(total / parsedLimit) || 0,
      },
    };

    // SAVE CACHE
    if (redis) {
      await redis.set(cacheKey, response, { ex: 120 }); // 2 minutes
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error happened while displaying all the products:', error);

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

// Return by categories
export const categories = async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      return res.status(401).json({ message: 'Please select any categories' });
    }

    const cacheKey = `category:${category}`;

    // CHECK CACHE
    if (redis) {
      const cached = await redis.get(cacheKey);

      if (cached) {
        return res.status(200).json(cached);
      }
    }

    const validCategories = await Category.findOne({ slug: category })
      .populate({
        path: 'products',
        populate: [
          { path: 'variants', select: 'name price' },
          { path: 'category', select: 'name' },
        ],
      })
      .lean();

    if (!validCategories) {
      return res.status(404).json({ message: 'Categories is not found' });
    }

    const products = validCategories.products;

    const response = {
      message: 'Categories products fetch successfully',
      products,
    };

    // SAVE CACHE
    if (redis) {
      await redis.set(cacheKey, response, { ex: 180 });
    }

    return res.status(200).json(response);
  } catch (error) {
    console.log('Error happen while fetching the categories:', error);

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

// Return a single product by Slug
export const slugView = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res
        .status(400)
        .json({ message: 'Please provide a valid product slug' });
    }

    const cacheKey = `product:slug:${slug}`;

    // CHECK CACHE
    if (redis) {
      const cached = await redis.get(cacheKey);

      if (cached) {
        return res.status(200).json(cached);
      }
    }

    const product = await Product.findOne({ slug })
      .populate('variants', 'name price')
      .populate('category', 'name')
      .lean();

    if (!product) {
      return res.status(404).json({ message: 'No product found' });
    }

    const response = {
      message: 'Product fetched successfully',
      products: product,
    };

    // SAVE CACHE
    if (redis) {
      await redis.set(cacheKey, response, { ex: 600 });
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error happened while fetching product:', error);

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};
