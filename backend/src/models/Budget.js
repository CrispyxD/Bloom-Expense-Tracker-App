import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true, maxlength: 40 },
    limitCents: { type: Number, required: true, min: 1, max: 1_000_000_000 },
    color: { type: String, match: /^#[0-9a-fA-F]{6}$/, default: "#7b72e9" },
  },
  { timestamps: true },
);

budgetSchema.index({ userId: 1, category: 1 }, { unique: true });

export default mongoose.models.Budget ?? mongoose.model("Budget", budgetSchema);
