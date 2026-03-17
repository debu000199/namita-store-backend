import { Redis } from '@upstash/redis';

let redis = null;

const isRedisConfigured =
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN;

if (isRedisConfigured) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  console.log('✅ Upstash Redis connected');
} else {
  console.warn('⚠️ Redis disabled (missing env variables)');
}

export default redis;