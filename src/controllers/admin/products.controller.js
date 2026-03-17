import Category from '../../models/catagories.model.js';
import Product from '../../models/product.model.js';
import ProductVariant from '../../models/productVariant.model.js';

// -------------------------------------------------------------------
// 1. DASHBOARD: Fetch all products with pagination
// -------------------------------------------------------------------
export const dashboard = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100); // 1..100
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const [getProducts, total] = await Promise.all([
      Product.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate('category', 'name')
        .populate({ path: 'variants', select: 'name price stock' })
        .lean(),
      Product.countDocuments(),
    ]);

    if (!getProducts || getProducts.length === 0) {
      return res.status(404).json({ message: 'No product found' });
    }

    res.status(200).json({
      message: 'Products fetch successfully',
      getProducts,
      meta: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit) || 0,
      },
    });
  } catch (error) {
    console.error('Error happen inside admin controller: ', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// -------------------------------------------------------------------
// 2. CREATE PRODUCT: Safely insert product and its variants
// -------------------------------------------------------------------
export const create = async (req, res) => {
  try {
    const { title, description, category, images, variants } = req.body;

    // Strict validation check
    if (
      !title ||
      !images ||
      images.length === 0 ||
      !variants ||
      variants.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Title, image url, and variants are required',
      });
    }

    let categoryDoc = null;
    if (category) {
      categoryDoc = await Category.findOne({ name: category });
      if (!categoryDoc) {
        return res
          .status(404)
          .json({ success: false, message: 'Category not found' });
      }
    }

    // Create the base product first
    const product = await Product.create({
      title,
      description,
      category: categoryDoc ? categoryDoc._id : null,
      images,
      variants: [],
    });

    try {
      // Map frontend data to schema structure
      const variantsData = variants.map(v => ({
        product: product._id,
        name: v.name,
        price: v.price,
        stock: v.stock,
        currency: 'INR',
      }));

      // Bulk insert variants safely
      const variantDocs = await ProductVariant.insertMany(variantsData);

      // Save variant IDs in the product
      product.variants = variantDocs.map(v => v._id);
      await product.save();

      // Add product to category
      if (categoryDoc) {
        categoryDoc.products.push(product._id);
        await categoryDoc.save();
      }

      return res.status(201).json({
        success: true,
        message: 'Product created successfully',
        product,
      });
    } catch (variantError) {
      // MANUAL ROLLBACK: Prevent orphaned products blocking future attempts
      await Product.findByIdAndDelete(product._id);
      console.error(
        'Variant Creation Failed. Product rolled back:',
        variantError
      );

      return res.status(400).json({
        success: false,
        message:
          'Failed to create variants. Make sure no variant fields are missing or duplicated.',
        error: variantError.message,
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Product already exists (duplicate title or slug)',
      });
    }

    console.error('Error while adding the product:: ', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating product',
    });
  }
};

// -------------------------------------------------------------------
// 3. CREATE CATEGORY
// -------------------------------------------------------------------
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Categories name is required' });
    }

    const existingCategories = await Category.findOne({ name });
    if (existingCategories) {
      return res.status(409).json({ message: 'Category already exists' });
    }

    const newCategories = await Category.create({ name });

    return res.status(201).json({
      success: true,
      message: 'Categories created successfully',
      newCategories,
    });
  } catch (error) {
    console.error('Error happen while creating categories:: ', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating product',
    });
  }
};

// -------------------------------------------------------------------
// 4. GET CATEGORIES
// -------------------------------------------------------------------
export const getCategory = async (req, res) => {
  try {
    const allCategories = await Category.find();
    if (!allCategories) {
      return res.status(404).json({ message: 'No categories found' });
    }

    res.status(200).json({
      message: 'All categories found successfully',
      allCategories,
    });
  } catch (error) {
    console.error('Error happen while getting the categories', error);
    // FIXED Typo: res.status instead of res.staus
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// -------------------------------------------------------------------
// 5. EDIT PRODUCT: Update product fields and replace variants
// -------------------------------------------------------------------
export const editProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: 'No product id provided' });
    }

    // FIXED: Extracted variants from req.body
    const { title, description, category, images, variants } = req.body;

    if (!title || !images || images.length === 0) {
      return res
        .status(400)
        .json({ message: 'Title and at least one image URL are required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let newCategoryDoc = null;
    if (category) {
      try {
        newCategoryDoc = await Category.findById(category);
      } catch (e) {
        console.error(e);
        newCategoryDoc = null;
      }
      if (!newCategoryDoc) {
        newCategoryDoc = await Category.findOne({ name: category });
      }
      if (!newCategoryDoc && category) {
        return res.status(404).json({ message: 'Category not found' });
      }
    }

    const oldCategoryId = product.category ? product.category.toString() : null;
    const newCategoryId = newCategoryDoc ? newCategoryDoc._id.toString() : null;

    // Apply main updates
    product.title = title;
    product.description = description;
    product.images = images;
    product.category = newCategoryDoc ? newCategoryDoc._id : null;

    // FIXED: Handle Variant Updates (Replace old with new)
    if (variants && Array.isArray(variants) && variants.length > 0) {
      await ProductVariant.deleteMany({ product: product._id });

      const variantsData = variants.map(v => ({
        product: product._id,
        name: v.name,
        price: v.price,
        stock: v.stock,
        currency: 'INR',
      }));

      const variantDocs = await ProductVariant.insertMany(variantsData);
      product.variants = variantDocs.map(v => v._id);
    }

    const updated = await product.save();

    // Category shifting logic
    if (oldCategoryId !== newCategoryId) {
      if (oldCategoryId) {
        const oldCat = await Category.findById(oldCategoryId);
        if (oldCat) {
          oldCat.products = oldCat.products.filter(
            pid => pid.toString() !== product._id.toString()
          );
          await oldCat.save();
        }
      }

      if (newCategoryDoc) {
        if (
          !newCategoryDoc.products.some(
            pid => pid.toString() === product._id.toString()
          )
        ) {
          newCategoryDoc.products.push(product._id);
          await newCategoryDoc.save();
        }
      }
    }

    return res.status(200).json({
      message: 'Product updated successfully',
      product: updated,
    });
  } catch (error) {
    console.error('Error happen while edit product : ', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// -------------------------------------------------------------------
// 6. GET SINGLE PRODUCT
// -------------------------------------------------------------------
export const getProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(401).json({ message: 'Product id is not found' });
    }

    const isProduct = await Product.findById(productId);

    if (!isProduct) {
      return res
        .status(404)
        .json({ message: 'Product not found or was deleted' });
    }

    return res.status(200).json({
      message: 'Product details fetch successfully',
      isProduct,
    });
  } catch (error) {
    console.error('Error happen while get the product: ', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// -------------------------------------------------------------------
// 7. DELETE PRODUCT: Delete product and its orphaned variants
// -------------------------------------------------------------------
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: 'No product id provided' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const categoryId = product.category ? product.category.toString() : null;

    // FIXED: Delete all variants associated with this product before deleting the product
    await ProductVariant.deleteMany({ product: productId });

    const deleted = await Product.findByIdAndDelete(productId);

    if (categoryId) {
      const categoryDoc = await Category.findById(categoryId);
      if (categoryDoc) {
        categoryDoc.products = categoryDoc.products.filter(
          pid => pid.toString() !== productId
        );
        await categoryDoc.save();
      }
    }

    return res.status(200).json({
      message: 'Product deleted successfully',
      product: deleted,
    });
  } catch (error) {
    console.error('Error happen while deleting the product', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
