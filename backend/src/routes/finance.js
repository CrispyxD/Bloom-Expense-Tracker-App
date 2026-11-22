import { Router } from "express";
import mongoose from "mongoose";
import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  budgetResponse,
  isValidAvatar,
  categories,
  isValidDate,
  profileResponse,
  supportedCurrencies,
  toCents,
  transactionResponse,
} from "../utils/finance.js";

const router = Router();
router.use(requireAuth);

router.get("/profile", (request, response) => {
  response.json({ profile: profileResponse(request.user) });
});

router.put("/profile", async (request, response) => {
  const { name, currency, monthlyIncome, avatar } = request.body;
  const normalizedName = typeof name === "string" ? name.trim() : "";
  const income = Number(monthlyIncome);
  const incomeCents = Math.round((income + Number.EPSILON) * 100);
  if (normalizedName.length < 1 || normalizedName.length > 80) {
    return response.status(400).json({ message: "Name must be between 1 and 80 characters." });
  }
  if (!supportedCurrencies.includes(currency)) {
    return response.status(400).json({ message: "Choose a supported currency." });
  }
  if (!Number.isFinite(income) || income < 0 || income > 10_000_000 || !Number.isSafeInteger(incomeCents)) {
    return response.status(400).json({ message: "Monthly income must be a non-negative amount." });
  }
  if (avatar !== undefined && avatar !== null && !isValidAvatar(avatar)) {
    return response.status(400).json({ message: "Choose a valid image under 24 KB." });
  }

  const updates = {
    name: normalizedName,
    currency,
    monthlyIncomeCents: incomeCents,
  };
  if (avatar !== undefined) updates.avatar = avatar;
  const user = await User.findByIdAndUpdate(
    request.user._id,
    { $set: updates },
    { new: true, runValidators: true },
  );
  response.json({ profile: profileResponse(user) });
});

router.get("/transactions", async (request, response) => {
  const query = { userId: request.user._id };
  if (request.query.type === "income" || request.query.type === "expense") {
    query.type = request.query.type;
  }
  if (typeof request.query.q === "string" && request.query.q.trim()) {
    const safeQuery = request.query.q.trim().slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { name: { $regex: safeQuery, $options: "i" } },
      { category: { $regex: safeQuery, $options: "i" } },
      { note: { $regex: safeQuery, $options: "i" } },
    ];
  }
  const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 }).limit(1000);
  response.json({ transactions: transactions.map(transactionResponse) });
});

function validateTransaction(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const category = typeof body.category === "string" ? body.category : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";
  const amountCents = toCents(body.amount);
  if (!name || name.length > 100) return { error: "Name must be between 1 and 100 characters." };
  if (!categories.includes(category)) return { error: "Choose a valid transaction category." };
  if (!isValidDate(body.date)) return { error: "Enter a valid transaction date." };
  if (!amountCents) return { error: "Amount must be greater than zero and at most 10,000,000." };
  if (body.type !== "income" && body.type !== "expense") return { error: "Choose income or expense." };
  if (note.length > 300) return { error: "Notes must be 300 characters or fewer." };
  return {
    value: {
      name,
      category,
      date: body.date,
      amountCents,
      type: body.type,
      note,
    },
  };
}

router.post("/transactions", async (request, response) => {
  const validated = validateTransaction(request.body);
  if (validated.error) return response.status(400).json({ message: validated.error });
  const transaction = await Transaction.create({ ...validated.value, userId: request.user._id });
  response.status(201).json({ transaction: transactionResponse(transaction) });
});

router.put("/transactions/:id", async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: "Invalid transaction id." });
  }
  const validated = validateTransaction(request.body);
  if (validated.error) return response.status(400).json({ message: validated.error });
  const transaction = await Transaction.findOneAndUpdate(
    { _id: request.params.id, userId: request.user._id },
    { $set: validated.value },
    { new: true, runValidators: true },
  );
  if (!transaction) return response.status(404).json({ message: "Transaction not found." });
  response.json({ transaction: transactionResponse(transaction) });
});

router.delete("/transactions/:id", async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: "Invalid transaction id." });
  }
  const transaction = await Transaction.findOneAndDelete({
    _id: request.params.id,
    userId: request.user._id,
  });
  if (!transaction) return response.status(404).json({ message: "Transaction not found." });
  response.status(204).end();
});

router.get("/budgets", async (request, response) => {
  const budgets = await Budget.find({ userId: request.user._id }).sort({ category: 1 });
  response.json({ budgets: budgets.map(budgetResponse) });
});

router.put("/budgets/:category", async (request, response) => {
  const category = request.params.category;
  const limitCents = toCents(request.body.limit);
  const color = typeof request.body.color === "string" ? request.body.color : "#7b72e9";
  if (!categories.includes(category)) {
    return response.status(400).json({ message: "Choose a valid budget category." });
  }
  if (!limitCents) return response.status(400).json({ message: "Budget must be greater than zero." });
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    return response.status(400).json({ message: "Enter a valid budget color." });
  }

  const budget = await Budget.findOneAndUpdate(
    { userId: request.user._id, category },
    { $set: { limitCents, color } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  response.json({ budget: budgetResponse(budget) });
});

router.delete("/budgets/:category", async (request, response) => {
  const deleted = await Budget.findOneAndDelete({
    userId: request.user._id,
    category: request.params.category,
  });
  if (!deleted) return response.status(404).json({ message: "Budget not found." });
  response.status(204).end();
});

router.use((error, request, response, next) => {
  if (error instanceof mongoose.Error.ValidationError) {
    return response.status(400).json({ message: "The submitted finance data is invalid." });
  }
  return next(error);
});

export default router;
