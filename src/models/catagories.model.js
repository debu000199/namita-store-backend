import mongoose from 'mongoose';
import slugify from 'slugify';

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [100, 'Category name must be under 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  { timestamps: true }
);

/* ==========================
   AUTO-GENERATE SLUG
========================== */
CategorySchema.pre('validate', function () {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
    });
  }
});

const Category = mongoose.model('Category', CategorySchema);

export default Category;
