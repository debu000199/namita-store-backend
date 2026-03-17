import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      lowercase: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [100, 'Product name must be under 100 characters'],
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
      index: true,
      trim: true,
    },

    description: {
      type: String,
      maxlength: [500, 'Description must be under 500 characters'],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      // required: false,
    },

    variants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
      },
    ],

    images: [
      {
        type: String,
        required: true,
      },
    ],
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

// Generate Slug
productSchema.pre('validate', function () {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
    });
  }
});

const Product = mongoose.model('Product', productSchema);

export default Product;
