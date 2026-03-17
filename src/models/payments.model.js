import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    stripePaymentIntentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    amountCents: {
      type: Number,
      required: true,
      min: [0, 'Amount must be positive'],
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    status: {
      type: String,
      required: true,
      enum: [
        'requires_payment_method',
        'requires_confirmation',
        'requires_action',
        'processing',
        'succeeded',
        'canceled',
        'failed',
      ],
      index: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: false,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // matches Prisma createdAt only
  }
);

export default mongoose.model('Payment', paymentSchema);
