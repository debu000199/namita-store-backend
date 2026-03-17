export const JWT_SECRET =
  process.env.JWT_SECRET || 'your-secret-key-change-in-production';
export const JWT_EXPIRE = process.env.JWT_EXPIRE || '1d';
export const COOKIE_EXPIRE = process.env.COOKIE_EXPIRE || 1;

// ADMIN
export const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
export const ADMIN_JWT_SECRET_EXPIRE = process.env.ADMIN_JWT_SECRET_EXPIRE;

export const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
};
