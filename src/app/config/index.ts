import 'dotenv/config';

export const config = {
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL,
};