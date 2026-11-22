import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.js";
import financeRoutes from "./routes/finance.js";

const app = express();
const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.disable("x-powered-by");
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(null, false);
    },
  }),
);
app.use(express.json({ limit: "32kb" }));
app.use((request, response, next) => {
  const origin = request.get("origin");
  if (
    origin &&
    !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
    !allowedOrigins.has(origin)
  ) {
    return response.status(403).json({ message: "This origin is not allowed by the API." });
  }
  return next();
});
app.use("/api", (request, response, next) => {
  response.setHeader("Cache-Control", "no-store");
  return next();
});

app.get("/health", (request, response) => {
  response.json({ status: "ok" });
});
app.use("/api/auth", authRoutes);
app.use("/api", financeRoutes);

app.use((request, response) => {
  response.status(404).json({ message: "API route not found." });
});

app.use((error, request, response, next) => {
  if (response.headersSent) return next(error);
  if (error?.type === "entity.parse.failed") {
    return response.status(400).json({ message: "Request body must be valid JSON." });
  }
  if (error?.type === "entity.too.large") {
    return response.status(413).json({ message: "Request body is too large." });
  }
  if (error?.code === 11000) {
    return response.status(409).json({ message: "A record with that value already exists." });
  }
  if (error instanceof SyntaxError && error.status === 400) {
    return response.status(400).json({ message: "Request body must be valid JSON." });
  }
  console.error("API request failed:", error);
  return response.status(500).json({ message: "Something went wrong. Please try again." });
});

export default app;
