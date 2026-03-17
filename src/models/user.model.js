import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [50, 'Name must be under 50 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // 🔐 never return password by default
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },

    // Reference to Order collection
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);

/* ==========================
   HASH PASSWORD
========================== */
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return;

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    next(error);
  }
});

/* ==========================
   PASSWORD COMPARISON
========================== */
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ==========================
   CLEAN OUTPUT
========================== */
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', UserSchema);

export default User;
