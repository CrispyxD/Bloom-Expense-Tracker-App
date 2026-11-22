import test from "node:test";
import assert from "node:assert/strict";
import {
  budgetResponse,
  isValidAvatar,
  isValidDate,
  profileResponse,
  supportedCurrencies,
  toCents,
  transactionResponse,
} from "./finance.js";

test("toCents accepts positive dollar amounts and rounds to cents", () => {
  assert.equal(toCents(12.34), 1234);
  assert.equal(toCents(1.005), 101);
  assert.equal(toCents(0.01), 1);
});

test("toCents rejects invalid, zero, negative, and excessive values", () => {
  for (const value of [0, -1, "not money", Number.NaN, Infinity, 10_000_000.01]) {
    assert.equal(toCents(value), null);
  }
});

test("isValidDate checks calendar dates, not only their string shape", () => {
  assert.equal(isValidDate("2026-10-27"), true);
  assert.equal(isValidDate("2026-02-29"), false);
  assert.equal(isValidDate("2026-13-01"), false);
  assert.equal(isValidDate("27-10-2026"), false);
});

test("isValidAvatar accepts bounded base64 image data and rejects other input", () => {
  assert.equal(isValidAvatar("data:image/jpeg;base64,SGVsbG8="), true);
  assert.equal(isValidAvatar("data:image/png;base64,SGVsbG8="), true);
  assert.equal(isValidAvatar("data:image/webp;base64,SGVsbG8="), true);
  assert.equal(isValidAvatar("data:text/html;base64,SGVsbG8="), false);
  assert.equal(isValidAvatar("https://example.com/avatar.jpg"), false);
  assert.equal(isValidAvatar(`data:image/jpeg;base64,${"a".repeat(24_000)}`), false);
});

test("all supported currencies are valid and renderable ISO currency codes", () => {
  assert.ok(supportedCurrencies.includes("MMK"));
  assert.ok(supportedCurrencies.includes("JPY"));
  assert.ok(supportedCurrencies.includes("EUR"));
  for (const code of supportedCurrencies) {
    assert.doesNotThrow(() => new Intl.NumberFormat("en-US", { style: "currency", currency: code }));
  }
});

test("API serializers expose dollar amounts and omit password hashes", () => {
  const user = profileResponse({
    _id: "user-id",
    name: "Alex",
    email: "alex@example.com",
    currency: "USD",
    monthlyIncomeCents: 520000,
    passwordHash: "must-not-be-returned",
  });
  assert.deepEqual(user, {
    id: "user-id",
    name: "Alex",
    email: "alex@example.com",
    currency: "USD",
    monthlyIncome: 5200,
    avatar: null,
  });

  assert.deepEqual(transactionResponse({
    _id: "transaction-id",
    name: "Lunch",
    category: "Food & drink",
    date: "2026-10-27",
    amountCents: 1234,
    type: "expense",
    note: "",
  }), {
    id: "transaction-id",
    name: "Lunch",
    category: "Food & drink",
    date: "2026-10-27",
    amount: 12.34,
    type: "expense",
    note: "",
  });

  assert.deepEqual(budgetResponse({
    category: "Food & drink",
    limitCents: 50000,
    color: "#7b72e9",
  }), {
    category: "Food & drink",
    limit: 500,
    color: "#7b72e9",
  });
});
