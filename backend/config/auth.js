const JWT_SECRET = process.env.JWT_SECRET || "dashboard_development_secret_change_me";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.warn("JWT_SECRET is not set. Set a strong JWT_SECRET in production.");
}

module.exports = { JWT_SECRET };
