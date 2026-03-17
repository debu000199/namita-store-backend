import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false } // prevents automatic _id for each item
);

const addressSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    line1: {
      type: String,
      required: true,
      trim: true,
    },
    line2: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },

    items: {
      type: [orderItemSchema], // better than raw JSON
      required: true,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ['pending', 'paid', 'fulfilled', 'canceled'],
      default: 'pending',
      index: true,
    },

    address: {
      type: [addressSchema],
      required: true,
    },

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // only createdAt like Prisma
  }
);

export default mongoose.model('Order', orderSchema);
