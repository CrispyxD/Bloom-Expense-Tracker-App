"use client";

import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Icon, useDashboard } from "./components/DashboardApp";

export default function Page() {
  const {
    profile,
    now,
    currency,
    balance,
    showBalance,
    balanceMenuOpen,
    setBalanceMenuOpen,
    balanceMenuRef,
    openAddModal: addTransaction,
    navigateToPage,
    setShowBalance,
    setNotificationsOpen,
    previousBalance,
    trend,
    income,
    expenses,
    incomeChange,
    expensesChange,
    previousIncome,
    previousExpenses,
    period,
    setPeriod,
    maxChart,
    visibleChartData,
    spendingByCategory,
    recentTransactions,
    renderTransactionsTable,
  } = useDashboard();

  return (
    <MotionConfig reducedMotion="user">
      <motion.section
        className="mx-auto w-full max-w-[1190px] px-4 py-6 sm:px-6 lg:px-11 lg:py-9 max-[800px]:py-7 max-[620px]:px-[15px] max-[620px]:py-[23px] max-w-[1190px] "
        initial={{ opacity: 0, y: 7 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.2, 0.75, 0.25, 1] }}
      >
      <div className="mb-7 flex items-end justify-between gap-5 [&_h1]:text-[30px] [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-slate-800 dark:[&_h1]:text-slate-100 max-[620px]:items-start max-[620px]:mb-5 max-[620px]:[&_h1]:text-[26px] ">
        <div>
          <p className="mb-2 text-[10px] font-bold tracking-[1.2px] text-violet-600 dark:text-violet-300 ">
            {now
              .toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })
              .toUpperCase()}
          </p>
          <h1>
            Good morning, {profile.name.trim().split(/\s+/)[0]}{" "}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-[620px]:max-w-[265px] max-[620px]:text-[11px] ">
            Here’s your money at a glance. You’re doing great.
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 max-[620px]:min-h-9 max-[620px]:gap-1 max-[620px]:px-2.5 max-[620px]:text-[10px] "
          onClick={() => addTransaction()}
        >
          <Icon name="plus" size={18} />
          {" "}
          Add transaction
        </button>
      </div>

      <section className="grid grid-cols-[1.28fr_1fr_1fr] gap-4 max-[1100px]:gap-2.5 max-[800px]:grid-cols-2 max-[620px]:grid-cols-1 ">
        <article className={`relative min-h-[204px] overflow-hidden rounded-xl border-0 bg-gradient-to-br from-violet-600 to-violet-400 p-5 text-white shadow-sm rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25]${balanceMenuOpen ? " z-10 overflow-visible [&_.balance-decoration]:invisible [&_.card-overline]:z-[7]" : ""} `}>
          <div className="relative z-[1] flex items-center justify-between text-[10px] font-semibold tracking-widest text-white/75 ">
            <span>YOUR BALANCE</span>
            <div className="relative " ref={balanceMenuRef}>
              <button
                className="relative z-[6] grid size-7 place-items-center rounded-lg bg-white/15 text-white transition hover:scale-105 hover:bg-white/25 "
                aria-label="Balance options"
                aria-expanded={balanceMenuOpen}
                onClick={() => {
                  setBalanceMenuOpen((open) => !open);
                  setNotificationsOpen(false);
                }}
              >
                <Icon name="dots" size={18} />
              </button>
              <AnimatePresence>
                {balanceMenuOpen && (
                  <motion.div
                    className="absolute right-0 top-[calc(100%+7px)] z-50 w-[155px] origin-top-right overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-[#191b25] [&_button]:block [&_button]:w-full [&_button]:rounded-md [&_button]:px-2.5 [&_button]:py-2 [&_button]:text-left [&_button]:text-[11px] [&_button]:text-slate-600 [&_button:hover]:bg-violet-50 dark:[&_button]:text-slate-200 dark:[&_button:hover]:bg-violet-950/50 "
                    role="menu"
                    initial={{ opacity: 0, y: -5, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: [0.2, 0.75, 0.25, 1] }}
                  >
                    <button
                      role="menuitem"
                      onClick={() => {
                        setBalanceMenuOpen(false);
                        addTransaction("income");
                      }}
                    >
                      Add income
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => {
                        setBalanceMenuOpen(false);
                        addTransaction("expense");
                      }}
                    >
                      Add expense
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => {
                        setBalanceMenuOpen(false);
                        navigateToPage("Analytics");
                      }}
                    >
                      View analytics
                    </button>
                    <button
                      role="menuitem"
                      onClick={() =>
                        setShowBalance((visible) => !visible)
                      }
                    >
                      {showBalance ? "Hide balance" : "Show balance"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="relative mt-5 text-3xl font-bold tracking-tight ">
            {showBalance ? currency(balance, profile.currency) : "••••••"}
          </div>
          <div className="relative mt-1 text-xs text-white/80 ">
            <span className="inline-flex items-center gap-1 ">
              <Icon
                name={previousBalance > 0 && balance < previousBalance ? "down" : "up"}
                size={15}
              />
              {trend(balance, previousBalance)}
            </span>
          </div>
          <div className="my-4 h-px bg-white/20 " />
          <div className="flex justify-between gap-4 text-xs text-white/80 max-[1100px]:gap-2 ">
            <span>
              <i className="mr-1 inline-block size-2 rounded-full bg-emerald-200 " />
              Income
              {" "}
              <strong>{currency(income, profile.currency, true)}</strong>
            </span>
            <span>
              <i className="mr-1 inline-block size-2 rounded-full bg-rose-200 " />
              Expenses
              {" "}
              <strong>{currency(expenses, profile.currency, true)}</strong>
            </span>
          </div>
          <div className="pointer-events-none absolute rounded-full border border-white/10 -right-11 -top-16 size-48 " />
          <div className="pointer-events-none absolute rounded-full border border-white/10 -right-1 -top-7 size-28 " />
        </article>
        <article className="relative min-h-[204px] overflow-hidden rounded-xl border border-slate-200 bg-white p-[18px] shadow-sm dark:border-slate-700 dark:bg-[#191b25] rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] border-emerald-100 dark:border-slate-700 [&_.summary-icon]:bg-emerald-50 [&_.summary-icon]:text-emerald-600 ">
          <div className="mb-4 flex items-center justify-between ">
            <span className="grid size-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300 ">
              <Icon name="down" size={18} />
            </span>
            <span
              className={`inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 ${incomeChange !== null && incomeChange < 0 ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300" : ""} `}
            >
              {incomeChange === null ? (
                "No previous data"
              ) : (
                <>
                  <Icon
                    name={incomeChange >= 0 ? "up" : "down"}
                    size={14}
                  />
                  {Math.abs(incomeChange)}%
                </>
              )}
            </span>
          </div>
          <span className="text-[10px] font-bold tracking-[.8px] text-slate-400 ">
            TOTAL INCOME
          </span>
          <strong className="mt-2 block text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 ">
            {currency(income, profile.currency)}
          </strong>
          <span className="mt-1 block text-[10px] text-slate-400 ">
            {trend(income, previousIncome)}
          </span>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 opacity-80 [&_svg]:size-full [&_svg]:overflow-visible [&_path]:fill-none [&_path]:stroke-[2.5] [&_path]:[vector-effect:non-scaling-stroke] [&_path]:stroke-emerald-400 ">
            <svg
              viewBox="0 0 220 50"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M0 39 C20 36 27 19 44 26 S70 40 86 23 S112 30 130 13 S154 30 171 14 S201 20 220 4" />
            </svg>
          </div>
        </article>
        <article className="relative min-h-[204px] overflow-hidden rounded-xl border border-slate-200 bg-white p-[18px] shadow-sm dark:border-slate-700 dark:bg-[#191b25] rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] border-rose-100 dark:border-slate-700 [&_.summary-icon]:bg-rose-50 [&_.summary-icon]:text-rose-600 ">
          <div className="mb-4 flex items-center justify-between ">
            <span className="grid size-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300 ">
              <Icon name="up" size={18} />
            </span>
            <span
              className={`inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 ${expensesChange !== null && expensesChange > 0 ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300" : "text-slate-400"} `}
            >
              {expensesChange === null ? (
                "No previous data"
              ) : (
                <>
                  <Icon
                    name={expensesChange <= 0 ? "down" : "up"}
                    size={14}
                  />
                  {Math.abs(expensesChange)}%
                </>
              )}
            </span>
          </div>
          <span className="text-[10px] font-bold tracking-[.8px] text-slate-400 ">
            TOTAL EXPENSES
          </span>
          <strong className="mt-2 block text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 ">
            {currency(expenses, profile.currency)}
          </strong>
          <span className="mt-1 block text-[10px] text-slate-400 ">
            {trend(expenses, previousExpenses)}
          </span>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 opacity-80 [&_svg]:size-full [&_svg]:overflow-visible [&_path]:fill-none [&_path]:stroke-[2.5] [&_path]:[vector-effect:non-scaling-stroke] [&_path]:stroke-rose-300 ">
            <svg
              viewBox="0 0 220 50"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M0 12 C18 20 25 6 44 21 S69 38 86 23 S111 32 131 15 S151 30 173 25 S201 15 220 31" />
            </svg>
          </div>
        </article>
      </section>

      <section className="mt-4 grid grid-cols-[1.55fr_1fr] gap-4 max-[1100px]:grid-cols-[1.35fr_1fr] max-[1100px]:gap-2.5 max-[800px]:grid-cols-1 ">
        <article className="rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] p-5 max-[1100px]:px-3.5 max-[620px]:p-4 ">
          <div className="mb-5 flex items-center justify-between gap-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-800 [&_p]:mt-1 [&_p]:text-xs [&_p]:text-slate-400 dark:[&_h2]:text-slate-100 ">
            <div>
              <h2>Spending overview</h2>
              <p>Income and expenses over time</p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 "
              onClick={() =>
                setPeriod(
                  period === "This month" ? "Last 6 months" : "This month",
                )
              }
            >
              {period}
              <Icon name="down" size={16} />
            </button>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500 [&_span]:inline-flex [&_span]:items-center [&_span]:gap-1.5 ">
            <span>
              <i className="inline-block size-2 rounded-full bg-violet-500 " />
              Income
            </span>
            <span>
              <i className="inline-block size-2 rounded-full bg-rose-400 " />
              Expenses
            </span>
          </div>
          <div className="flex h-[230px] gap-3 ">
            <div className="flex flex-col justify-between pb-6 text-[10px] text-slate-400 ">
              <span>{currency(maxChart, profile.currency, true)}</span>
              <span>{currency(maxChart * 0.75, profile.currency, true)}</span>
              <span>{currency(maxChart * 0.5, profile.currency, true)}</span>
              <span>{currency(maxChart * 0.25, profile.currency, true)}</span>
              <span>{currency(0, profile.currency, true)}</span>
            </div>
            <div className="flex min-h-[160px] flex-1 items-end justify-around gap-2 border-b border-l border-slate-100 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(25%-1px),#f1f1f6_calc(25%-1px),#f1f1f6_25%)] px-2 dark:border-slate-700 ">
              {visibleChartData.map((item) => (
                <div className="flex w-[13%] flex-col items-center justify-end " key={item.month}>
                  <div className="flex h-[calc(100%-25px)] w-full items-end justify-center gap-1.5 ">
                    <motion.span
                      className="block min-h-[3px] w-[27%] max-w-[22px] rounded-t-md bg-violet-500 "
                      initial={{ height: 0 }}
                      animate={{ height: `${(item.income / maxChart) * 100}%` }}
                      transition={{ duration: 0.5, ease: [0.2, 0.75, 0.25, 1] }}
                    />
                    <motion.span
                      className="block min-h-[3px] w-[27%] max-w-[22px] rounded-t-md bg-rose-400 "
                      initial={{ height: 0 }}
                      animate={{ height: `${(item.expense / maxChart) * 100}%` }}
                      transition={{ duration: 0.5, ease: [0.2, 0.75, 0.25, 1] }}
                    />
                  </div>
                  <span className="mt-2 text-[10px] text-slate-400 ">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] p-5 max-[1100px]:px-3.5 ">
          <div className="mb-5 flex items-center justify-between gap-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-800 [&_p]:mt-1 [&_p]:text-xs [&_p]:text-slate-400 dark:[&_h2]:text-slate-100 ">
            <div>
              <h2>Monthly budgets</h2>
              <p>A little plan goes a long way.</p>
            </div>
            <button
              className="text-xs font-semibold text-violet-700 hover:text-violet-900 dark:text-violet-300 "
              onClick={() => navigateToPage("Budgets")}
            >
              See all <span>→</span>
            </button>
          </div>
          <div className="mt-5 grid gap-4 ">
            {spendingByCategory.slice(0, 4).map((item) => {
              const percent = Math.min((item.spent / item.limit) * 100, 100);

              return (
                <div className="grid gap-2" key={item.category}>
                  <div className="mb-1 flex items-center justify-between ">
                    <span className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 [&_i]:size-2 [&_i]:rounded-full ">
                      <i style={{ backgroundColor: item.color }} />
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-400 [&_strong]:text-slate-700 dark:[&_strong]:text-slate-200 ">
                      <strong>
                        {currency(item.spent, profile.currency, true)}
                      </strong>{" "}
                      / {currency(item.limit, profile.currency, true)}
                    </span>
                  </div>
                  <div className="h-[5px] overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700 [&_span]:block [&_span]:h-full [&_span]:rounded-full ">
                    <motion.span
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.5, ease: [0.2, 0.75, 0.25, 1] }}
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <button
            className="mt-5 text-left text-xs font-semibold text-violet-700 dark:text-violet-300 "
            onClick={() => navigateToPage("Budgets")}
          >
            Manage your budgets <span>→</span>
          </button>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] mt-4 p-5 max-[620px]:p-4 ">
        <div className="mb-5 flex items-center justify-between gap-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-800 [&_p]:mt-1 [&_p]:text-xs [&_p]:text-slate-400 dark:[&_h2]:text-slate-100 ">
          <div>
            <h2>Recent transactions</h2>
            <p>Your latest money moves.</p>
          </div>
          <button
            className="text-xs font-semibold text-violet-700 hover:text-violet-900 dark:text-violet-300 "
            onClick={() => navigateToPage("Transactions")}
          >
            View all <span>→</span>
          </button>
        </div>
        {renderTransactionsTable(recentTransactions)}
      </section>
      <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400 ">
        <span>Made for your money journey</span>
        <span className="text-violet-500 ">✳</span>
        <span>One mindful choice at a time.</span>
      </div>
      </motion.section>
    </MotionConfig>
  );
}
