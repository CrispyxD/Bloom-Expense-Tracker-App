export const categories = [
  "Food & drink",
  "Shopping",
  "Transport",
  "Housing",
  "Health",
  "Entertainment",
  "Salary",
  "Freelance",
  "Other",
];

export const supportedCurrencies = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "MMK",
  "JPY",
  "CNY",
  "INR",
  "CHF",
  "SGD",
  "HKD",
  "NZD",
  "KRW",
  "THB",
  "MYR",
  "IDR",
  "PHP",
  "VND",
  "BDT",
  "PKR",
  "NPR",
  "LKR",
  "KHR",
  "LAK",
  "AED",
  "SAR",
  "QAR",
  "BHD",
  "ZAR",
  "NGN",
  "KES",
  "EGP",
  "BRL",
  "MXN",
  "TRY",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
];

export function toCents(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) {
    return null;
  }
  const cents = Math.round((amount + Number.EPSILON) * 100);
  return cents >= 1 && cents <= 1_000_000_000 ? cents : null;
}

export function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function profileResponse(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    currency: user.currency,
    monthlyIncome: user.monthlyIncomeCents / 100,
    avatar: user.avatar ?? null,
  };
}

export function isValidAvatar(value) {
  return typeof value === "string" &&
    value.length <= 24_000 &&
    /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}

export function transactionResponse(transaction) {
  return {
    id: String(transaction._id),
    name: transaction.name,
    category: transaction.category,
    date: transaction.date,
    amount: transaction.amountCents / 100,
    type: transaction.type,
    note: transaction.note,
  };
}

export function budgetResponse(budget) {
  return {
    category: budget.category,
    limit: budget.limitCents / 100,
    color: budget.color,
  };
}
