import express from "express";
import mongoose from "mongoose";
import { authLimiter } from "../middlewares/rateLimit.js";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import jobRoutes from "./job.routes.js";
import applicationRoutes from "./application.routes.js";
const router = express.Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Liveness/readiness probe
 *     responses:
 *       200: { description: Service healthy }
 *       503: { description: Database unavailable }
 */
router.get("/health", (_req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({
    status: dbUp ? "ok" : "degraded",
    uptime: process.uptime(),
    db: dbUp ? "up" : "down",
  });
});

router.use("/auth", authLimiter, authRoutes);
router.use("/users", userRoutes);
router.use("/jobs", jobRoutes);
router.use("/applications", applicationRoutes);

export default router;
