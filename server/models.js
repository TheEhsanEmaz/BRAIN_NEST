import mongoose from "mongoose";

const { Schema } = mongoose;

const studentSchema = new Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    minlength: 3,
    maxlength: 32,
    match: /^[A-Z0-9_-]+$/
  },
  passwordHash: {
    type: String,
    required: true,
    select: false
  },
  creditsEnrolled: { type: Number, required: true, default: 0, min: 0, max: 18 }
}, { timestamps: true });

const sessionSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }
  }
}, { timestamps: true });

const courseSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: { type: String, required: true, trim: true },
  instructor: { type: String, required: true, trim: true },
  credits: { type: Number, required: true, min: 1, max: 18 },
  seats: { type: Number, required: true, min: 0 },
  schedule: { type: String, required: true, trim: true }
}, { timestamps: true });

const registrationSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true
  }
}, { timestamps: true });

registrationSchema.index({ student: 1, course: 1 }, { unique: true });

export const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);
export const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);
export const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);
export const Registration = mongoose.models.Registration || mongoose.model("Registration", registrationSchema);
