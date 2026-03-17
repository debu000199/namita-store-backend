import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error(
    'Please define the MONGO_URI environment variable inside .env'
  );
}

export const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) return;

    const options = {
      maxPoolSize: 20,
      minPoolSize: 5, // Slightly higher to handle instant traffic bursts
      socketTimeoutMS: 60000,
      serverSelectionTimeoutMS: 5000,
      waitQueueTimeoutMS: 10000, // 👈 Fail after 10s if pool is exhausted

      tls: process.env.NODE_ENV === 'production',
      autoIndex: process.env.NODE_ENV !== 'production',
    };

    await mongoose.connect(MONGO_URI, options);
    console.log('✅ Database Connected Successfully!');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    throw error;
  }
};

// 👈 Add this: Clean up connections when the app stops
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});
