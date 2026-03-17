import mongoose from 'mongoose';

const productVariantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true, // important for fast lookups by product
    },

    name: {
      type: String,
      required: [true, 'Variant name is required'],
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: [0, 'Price must be a positive number'],
    },

    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },

    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);

export default ProductVariant;
