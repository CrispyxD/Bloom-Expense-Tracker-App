import mongoose from "mongoose";
import { supportedCurrencies } from "../utils/finance.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    currency: { type: String, enum: supportedCurrencies, default: "USD" },
    monthlyIncomeCents: { type: Number, min: 0, default: 0 },
    avatar: { type: String, default: null, maxlength: 24000 },
  },
  { timestamps: true },
);

export default mongoose.models.User ?? mongoose.model("User", userSchema);
