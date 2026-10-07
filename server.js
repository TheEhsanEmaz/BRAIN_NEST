import dotenv from "dotenv";
import express from "express";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { connectToDatabase } from "./server/db.js";
import {
  clearSessionCookie,
  createSession,
  destroySession,
  hashPassword,
  HttpError,
  requireStudent,
  verifyPassword
} from "./server/auth.js";
import { Course, Registration, Session, Student } from "./server/models.js";

const projectRoot = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(projectRoot, ".env.local") });

const app = express();
const port = Number(process.env.PORT) || 3000;
const maxCredits = 18;
const studentIdPattern = /^[A-Za-z0-9_-]{3,32}$/;

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});
app.use(express.json({ limit: "10kb" }));

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function requireBodyString(value, field, maxLength) {
  if (typeof value !== "string" || value.length > maxLength) {
    throw new HttpError(400, `Please provide a valid ${field}.`);
  }
  return value.trim();
}

async function seedCoursesIfEmpty() {
  if (await Course.exists()) return;
  const seedPath = resolve(projectRoot, "js", "courses.json");
  const courses = JSON.parse(await readFile(seedPath, "utf8"));
  if (!Array.isArray(courses) || courses.length === 0) {
    throw new Error("The course catalog seed file is empty or invalid.");
  }
  await Course.insertMany(courses);
  console.info(`Seeded ${courses.length} courses from js/courses.json.`);
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: "connected" });
});

app.get("/api/courses", asyncRoute(async (req, res) => {
  const courses = await Course.find()
    .select("id name instructor credits seats schedule")
    .sort({ id: 1 })
    .lean();
  res.json({ courses });
}));

app.post("/api/auth/register", asyncRoute(async (req, res) => {
  const studentId = requireBodyString(req.body?.studentId, "student ID", 32).toUpperCase();
  const password = req.body?.password;
  if (!studentIdPattern.test(studentId)) {
    throw new HttpError(400, "Student ID must be 3–32 letters, numbers, underscores, or hyphens.");
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    throw new HttpError(400, "Password must be between 8 and 128 characters.");
  }

  const student = await Student.create({
    studentId,
    passwordHash: await hashPassword(password)
  });
  await createSession(student, res);
  res.status(201).json({ student: { studentId: student.studentId } });
}));

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const studentId = requireBodyString(req.body?.studentId, "student ID", 32).toUpperCase();
  const password = req.body?.password;
  if (!studentIdPattern.test(studentId) || typeof password !== "string" || password.length > 128) {
    throw new HttpError(400, "Enter a valid student ID and password.");
  }

  const student = await Student.findOne({ studentId }).select("+passwordHash");
  if (!student || !(await verifyPassword(password, student.passwordHash))) {
    throw new HttpError(401, "Student ID or password is incorrect.");
  }

  await createSession(student, res);
  res.json({ student: { studentId: student.studentId } });
}));

app.get("/api/auth/me", requireStudent, (req, res) => {
  res.json({ student: { studentId: req.student.studentId } });
});

app.post("/api/auth/logout", requireStudent, asyncRoute(async (req, res) => {
  await destroySession(req);
  clearSessionCookie(res);
  res.status(204).end();
}));

app.get("/api/registrations", requireStudent, asyncRoute(async (req, res) => {
  const registrations = await Registration.find({ student: req.student._id })
    .populate("course", "id name instructor credits schedule seats")
    .sort({ createdAt: 1 })
    .lean();
  const courses = registrations
    .filter((registration) => registration.course)
    .map((registration) => registration.course);
  res.json({ courses, creditsEnrolled: req.student.creditsEnrolled, maxCredits });
}));

app.post("/api/registrations", requireStudent, asyncRoute(async (req, res) => {
  const courseId = requireBodyString(req.body?.courseId, "course ID", 32).toUpperCase();
  if (!/^[A-Z0-9_-]{2,32}$/.test(courseId)) {
    throw new HttpError(400, "Please provide a valid course ID.");
  }

  const transaction = await Student.startSession();
  let enrolledCourse;
  try {
    await transaction.withTransaction(async () => {
      const course = await Course.findOne({ id: courseId }).session(transaction);
      if (!course) throw new HttpError(404, "That course could not be found.");

      const existingRegistration = await Registration.exists({
        student: req.student._id,
        course: course._id
      }).session(transaction);
      if (existingRegistration) throw new HttpError(409, "You are already registered for this course.");

      const studentUpdate = await Student.updateOne(
        { _id: req.student._id, creditsEnrolled: { $lte: maxCredits - course.credits } },
        { $inc: { creditsEnrolled: course.credits } },
        { session: transaction }
      );
      if (studentUpdate.modifiedCount !== 1) {
        throw new HttpError(409, `You cannot exceed the ${maxCredits}-credit semester limit.`);
      }

      const updatedCourse = await Course.findOneAndUpdate(
        { _id: course._id, seats: { $gt: 0 } },
        { $inc: { seats: -1 } },
        { new: true, session: transaction }
      );
      if (!updatedCourse) throw new HttpError(409, "There are no seats left in this course.");

      await Registration.create([{
        student: req.student._id,
        course: updatedCourse._id
      }], { session: transaction });
      enrolledCourse = updatedCourse;
    });
  } finally {
    await transaction.endSession();
  }

  res.status(201).json({ course: {
    id: enrolledCourse.id,
    name: enrolledCourse.name,
    instructor: enrolledCourse.instructor,
    credits: enrolledCourse.credits,
    seats: enrolledCourse.seats,
    schedule: enrolledCourse.schedule
  } });
}));

app.delete("/api/registrations/:courseId", requireStudent, asyncRoute(async (req, res) => {
  const courseId = req.params.courseId.toUpperCase();
  if (!/^[A-Z0-9_-]{2,32}$/.test(courseId)) {
    throw new HttpError(400, "Please provide a valid course ID.");
  }

  const transaction = await Student.startSession();
  try {
    await transaction.withTransaction(async () => {
      const course = await Course.findOne({ id: courseId }).session(transaction);
      if (!course) throw new HttpError(404, "That course could not be found.");

      const registration = await Registration.findOneAndDelete({
        student: req.student._id,
        course: course._id
      }, { session: transaction });
      if (!registration) throw new HttpError(404, "You are not registered for this course.");

      const studentUpdate = await Student.updateOne(
        { _id: req.student._id, creditsEnrolled: { $gte: course.credits } },
        { $inc: { creditsEnrolled: -course.credits } },
        { session: transaction }
      );
      if (studentUpdate.modifiedCount !== 1) {
        throw new Error("Student credit totals are inconsistent with course registrations.");
      }
      await Course.updateOne({ _id: course._id }, { $inc: { seats: 1 } }, { session: transaction });
    });
  } finally {
    await transaction.endSession();
  }

  res.status(204).end();
}));

const pages = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/login.html", "login.html"],
  ["/courses.html", "courses.html"],
  ["/dashboard.html", "dashboard.html"],
  ["/css/style.css", "css/style.css"],
  ["/js/api.js", "js/api.js"],
  ["/js/dashboard.js", "js/dashboard.js"],
  ["/js/home-animation.js", "js/home-animation.js"],
  ["/js/login.js", "js/login.js"],
  ["/js/script.js", "js/script.js"],
  ["/js/storage.js", "js/storage.js"],
  ["/js/ui-polish.js", "js/ui-polish.js"]
]);

app.get([...pages.keys()], (req, res) => {
  res.sendFile(resolve(projectRoot, pages.get(req.path)));
});

app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found." });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }
  if (error?.code === 11000 && error.keyPattern?.studentId) {
    return res.status(409).json({ error: "An account with that student ID already exists." });
  }
  if (error?.code === 11000 && error.keyPattern?.student && error.keyPattern?.course) {
    return res.status(409).json({ error: "You are already registered for this course." });
  }
  if (error?.code === 11000) return res.status(409).json({ error: "This record already exists." });
  if (error?.name === "ValidationError" || error?.name === "CastError" || error?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "The submitted data is invalid." });
  }
  console.error(error);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

async function start() {
  await connectToDatabase();
  await Promise.all([
    Student.init(),
    Session.init(),
    Course.init(),
    Registration.init()
  ]);
  await seedCoursesIfEmpty();
  app.listen(port, "0.0.0.0", () => {
    console.info(`BRAIN-NEST is running at http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error(`Unable to start BRAIN-NEST: ${error.message}`);
  process.exitCode = 1;
});
