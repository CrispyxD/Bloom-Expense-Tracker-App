import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

const port = Number(process.env.PORT ?? 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port.");
}

await connectDB();

app.listen(port, () => {
  console.log(`Expense tracker API is running on port ${port}`);
});
