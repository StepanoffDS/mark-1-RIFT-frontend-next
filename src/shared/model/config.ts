export const CONFIG = {
  API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1',
  NODE_ENV: process.env.NODE_ENV,
};
