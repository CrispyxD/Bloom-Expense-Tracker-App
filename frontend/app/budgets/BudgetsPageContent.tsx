"use client";

import { motion, MotionConfig } from "framer-motion";
import { Icon, useDashboard } from "../components/DashboardApp";

export default function BudgetsPage() {
  const {
    expenses,
    profile,
    budgets,
    spendingByCategory,
    openBudgetModal,
    categoryIcon,
    currency,
  } = useDashboard();

  return (
    <MotionConfig reducedMotion="user">
    <motion.section
      className="mx-auto w-full max-w-[1190px] px-4 py-6 sm:px-6 lg:px-11 lg:py-9 max-[800px]:py-7 max-[620px]:px-[15px] max-[620px]:py-[23px] "
      initial={{ opacity: 0, y: 7 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.2, 0.75, 0.25, 1] }}
    >
      <div className="mb-7 flex items-end justify-between gap-5 [&_h1]:text-[30px] [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-slate-800 dark:[&_h1]:text-slate-100 max-[620px]:items-start max-[620px]:mb-5 max-[620px]:[&_h1]:text-[26px] ">
        <div>
          <p className="mb-2 text-[10px] font-bold tracking-[1.2px] text-violet-600 dark:text-violet-300 ">
            MAKE ROOM FOR WHAT MATTERS
          </p>
          <h1>
            Your monthly budgets
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-[620px]:max-w-[265px] max-[620px]:text-[11px] ">
            Thoughtful limits help your spending match your priorities.
          </p>
        </div>
        <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 max-[620px]:min-h-9 max-[620px]:gap-1 max-[620px]:px-2.5 max-[620px]:text-[10px] " onClick={() => openBudgetModal()}>
          <Icon name="plus" size={17} />
          {" "}
          Add a budget
        </button>
      </div>
      <div className="mb-4 flex items-center gap-8 p-5 [&>div]:grid [&>div]:gap-2 [&>div>strong]:text-2xl [&>div>strong]:font-bold max-[620px]:flex-wrap max-[620px]:gap-4 max-[620px]:p-4 max-[620px]:[&>div>strong]:text-xl rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] ">
        <div>
          <span className="text-[10px] font-bold tracking-[.8px] text-slate-400 ">
            TOTAL SPENT
          </span>
          <strong>
            {currency(expenses, profile.currency)}
          </strong>
        </div>
        <div className="h-10 w-px bg-slate-200 max-[620px]:hidden " />
        <div>
          <span className="text-[10px] font-bold tracking-[.8px] text-slate-400 ">
            TOTAL BUDGETED
          </span>
          <strong>
            {currency(
              budgets.reduce((sum, item) => sum + item.limit, 0),
              profile.currency,
            )}
          </strong>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-emerald-600 max-[620px]:ml-0 ">
          <span className="size-2 rounded-full bg-emerald-500 " />
          Looking good
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 max-[620px]:grid-cols-1 max-[620px]:gap-2.5 ">
        {spendingByCategory.map((budget) => {
          const percentage = Math.min((budget.spent / budget.limit) * 100, 100);

          return (
            <article className="p-5 max-[620px]:p-4 rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] [&_h3]:mb-2 [&_h3]:font-semibold " key={budget.category}>
              <div className="mb-4 flex items-center justify-between ">
                <span
                  className="grid size-[33px] shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600 max-[620px]:size-[30px] "
                  style={{
                    backgroundColor: `${budget.color}1c`,
                    color: budget.color,
                  }}
                >
                  <Icon name={categoryIcon(budget.category)} size={18} />
                </span>
                <button
                  className="relative inline-grid size-[34px] shrink-0 place-items-center rounded-lg bg-transparent text-slate-500 transition hover:bg-violet-50 hover:text-violet-700 active:scale-95 dark:text-slate-300 dark:hover:bg-violet-950/50 "
                  aria-label={`Edit ${budget.category} budget`}
                  onClick={() => openBudgetModal(budget.category)}
                >
                  <Icon name="dots" size={18} />
                </button>
              </div>
              <h3>
                {budget.category}
              </h3>
              <div className="mb-3 flex items-baseline gap-2 [&_strong]:text-xl [&_strong]:font-bold [&_span]:text-xs [&_span]:text-slate-400 ">
                <strong>
                  {currency(budget.spent, profile.currency)}
                </strong>
                <span>
                  of {currency(budget.limit, profile.currency)}
                </span>
              </div>
              <div className="h-[5px] overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700 [&_span]:block [&_span]:h-full [&_span]:rounded-full ">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: [0.2, 0.75, 0.25, 1] }}
                  style={{ backgroundColor: budget.color }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-slate-400 ">
                <span>
                  {Math.round(percentage)}% used
                </span>
                <span>
                  {currency(
                    Math.max(budget.limit - budget.spent, 0),
                    profile.currency,
                  )}{" "}
                  left
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </motion.section>
    </MotionConfig>
  );
}
