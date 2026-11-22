import { createHash } from "node:crypto";
import Session from "../models/Session.js";
import User from "../models/User.js";

const cookieName = "bloom_session";

function sessionCookie(request) {
  const cookieHeader = request.headers.cookie ?? "";
  const encoded = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
  if (!encoded) return null;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

export function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requireAuth(request, response, next) {
  const token = sessionCookie(request);
  if (!token || token.length > 200) {
    return response.status(401).json({ message: "Please sign in to continue." });
  }

  const session = await Session.findOne({
    tokenHash: hashSessionToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) {
    return response.status(401).json({ message: "Your session has expired. Please sign in again." });
  }

  const user = await User.findById(session.userId);
  if (!user) {
    await Session.deleteOne({ _id: session._id });
    return response.status(401).json({ message: "Your account could not be found. Please sign in again." });
  }

  request.user = user;
  request.sessionId = session._id;
  return next();
}
