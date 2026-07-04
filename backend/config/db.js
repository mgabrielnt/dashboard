const { Pool } = require("pg");

const hasConnectionString = Boolean(process.env.DATABASE_URL);

const poolConfig = hasConnectionString
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    };

if (process.env.DB_SSL === "true") {
  poolConfig.ssl = { rejectUnauthorized: false };
}

module.exports = new Pool(poolConfig);
