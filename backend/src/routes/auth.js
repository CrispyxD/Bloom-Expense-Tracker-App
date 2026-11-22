import { promisify } from "node:util";
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { Router } from "express";
import mongoose from "mongoose";
import Session from "../models/Session.js";
import User from "../models/User.js";
import { requireAuth, hashSessionToken } from "../middleware/requireAuth.js";
import { profileResponse } from "../utils/finance.js";

const router = Router();
const scrypt = promisify(scryptCallback);
const sessionDurationMs = 1000 * 60 * 60 * 24 * 30;
const cookieName = "bloom_session";
const secureCookie = process.env.NODE_ENV === "production";
const sameSite = secureCookie ? "None" : "Lax";

function setSessionCookie(response, token) {
  response.setHeader(
    "Set-Cookie",
    `${cookieName}=${encodeURIComponent(token)}; HttpOnly; Path=/api; SameSite=${sameSite}; Max-Age=${sessionDurationMs / 1000}${secureCookie ? "; Secure" : ""}`,
  );
}

function clearSessionCookie(response) {
  response.setHeader(
    "Set-Cookie",
    `${cookieName}=; HttpOnly; Path=/api; SameSite=${sameSite}; Max-Age=0${secureCookie ? "; Secure" : ""}`,
  );
}

async function createSession(user, response) {
  const token = randomBytes(32).toString("base64url");
  await Session.create({
    userId: user._id,
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(Date.now() + sessionDurationMs),
  });
  setSessionCookie(response, token);
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  const [salt, expectedHex] = storedHash.split(":");
  const expected = Buffer.from(expectedHex, "hex");
  const actual = await scrypt(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

router.post("/register", async (request, response) => {
  const name = typeof request.body.name === "string" ? request.body.name.trim() : "";
  const email = typeof request.body.email === "string" ? request.body.email.trim().toLowerCase() : "";
  const password = typeof request.body.password === "string" ? request.body.password : "";

  if (name.length < 1 || name.length > 80) {
    return response.status(400).json({ message: "Name must be between 1 and 80 characters." });
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({ message: "Enter a valid email address." });
  }
  if (password.length < 8 || password.length > 128) {
    return response.status(400).json({ message: "Password must be between 8 and 128 characters." });
  }

  const existingUser = await User.exists({ email });
  if (existingUser) {
    return response.status(409).json({ message: "An account with that email already exists." });
  }

  const user = await User.create({ name, email, passwordHash: await hashPassword(password) });
  await createSession(user, response);
  return response.status(201).json({ user: profileResponse(user) });
});

router.post("/login", async (request, response) => {
  const email = typeof request.body.email === "string" ? request.body.email.trim().toLowerCase() : "";
  const password = typeof request.body.password === "string" ? request.body.password : "";
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return response.status(401).json({ message: "Email or password is incorrect." });
  }

  await createSession(user, response);
  return response.json({ user: profileResponse(user) });
});

router.get("/me", requireAuth, (request, response) => {
  response.json({ user: profileResponse(request.user) });
});

router.post("/logout", requireAuth, async (request, response) => {
  if (request.sessionId) {
    await Session.deleteOne({ _id: request.sessionId });
  }
  clearSessionCookie(response);
  response.status(204).end();
});

router.use((error, request, response, next) => {
  if (error instanceof mongoose.Error.ValidationError) {
    return response.status(400).json({ message: "Please check your account details and try again." });
  }
  return next(error);
});

export default router;
