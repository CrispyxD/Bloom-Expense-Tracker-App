import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, required: true, maxlength: 40 },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    amountCents: { type: Number, required: true, min: 1, max: 1_000_000_000 },
    type: { type: String, required: true, enum: ["income", "expense"] },
    note: { type: String, trim: true, maxlength: 300, default: "" },
  },
  { timestamps: true },
);

transactionSchema.index({ userId:  1, date: -1 });

export default mongoose.models.Transaction ?? mongoose.model("Transaction", transactionSchema);
