import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { Session } from "./models.js";

const scrypt = promisify(scryptCallback);
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const sessionCookie = "brain_nest_session";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const digest = await scrypt(password, salt, 64);
  return `${salt}:${digest.toString("base64url")}`;
}

export async function verifyPassword(password, storedHash) {
  const [salt, encodedDigest] = storedHash.split(":");
  if (!salt || !encodedDigest) return false;

  const expected = Buffer.from(encodedDigest, "base64url");
  const actual = await scrypt(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions() {
  const options = ["Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${sessionLifetimeMs / 1000}`];
  if (process.env.NODE_ENV === "production") options.push("Secure");
  return options.join("; ");
}

export function clearSessionCookie(res) {
  const options = ["Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (process.env.NODE_ENV === "production") options.push("Secure");
  res.setHeader("Set-Cookie", `${sessionCookie}=; ${options.join("; ")}`);
}

export async function createSession(student, res) {
  const token = randomBytes(32).toString("base64url");
  await Session.create({
    student: student._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + sessionLifetimeMs)
  });
  res.setHeader("Set-Cookie", `${sessionCookie}=${token}; ${cookieOptions()}`);
}

function getSessionToken(req) {
  const cookieHeader = req.headers.cookie || "";
  const sessionCookiePart = cookieHeader.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookie}=`));
  return sessionCookiePart ? sessionCookiePart.slice(sessionCookie.length + 1) : "";
}

export async function requireStudent(req, res, next) {
  try {
    const token = getSessionToken(req);
    if (!token) throw new HttpError(401, "Please sign in to continue.");

    const session = await Session.findOne({
      tokenHash: hashToken(token),
      expiresAt: { $gt: new Date() }
    }).populate("student");

    if (!session || !session.student) {
      clearSessionCookie(res);
      throw new HttpError(401, "Please sign in to continue.");
    }

    req.student = session.student;
    req.sessionId = session._id;
    next();
  } catch (error) {
    next(error);
  }
}

export async function destroySession(req) {
  if (req.sessionId) await Session.deleteOne({ _id: req.sessionId });
}
