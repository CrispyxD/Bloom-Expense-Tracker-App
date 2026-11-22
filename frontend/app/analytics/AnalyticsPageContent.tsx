"use client";

import { useMemo } from "react";
import { motion, MotionConfig } from "framer-motion";
import { Icon, useDashboard } from "../components/DashboardApp";

const DONUT_COLORS = [
  "#7b72e9",
  "#58b88a",
  "#e99a57",
  "#df7186",
  "#5da4d4",
  "#a176c7",
  "#c5a044",
];

export default function AnalyticsPage() {
  const {
    period,
    setPeriod,
    analyticsIncome,
    analyticsExpenses,
    profile,
    analyticsData,
    maxChart,
    spendingByCategory,
    currency,
  } = useDashboard();

  const chartCategories = useMemo(
    () =>
      spendingByCategory.map((item, index) => ({
        ...item,
        chartColor: DONUT_COLORS[index % DONUT_COLORS.length],
      })),
    [spendingByCategory],
  );
  const categoryTotal = chartCategories.reduce(
    (total, item) => total + item.spent,
    0,
  );
  const donutGradient = useMemo(() => {
    if (categoryTotal === 0) {
      return "conic-gradient(#e9e8ef 0deg 360deg)";
    }

    let currentAngle = 0;
    const segments = chartCategories.map((item) => {
      const start = currentAngle;
      currentAngle += (item.spent / categoryTotal) * 360;
      return `${item.chartColor} ${start}deg ${currentAngle}deg`;
    });
    return `conic-gradient(${segments.join(", ")})`;
  }, [categoryTotal, chartCategories]);

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
            THE BIGGER PICTURE
          </p>
          <h1>
            Your money story
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-[620px]:max-w-[265px] max-[620px]:text-[11px] ">
            Small insights can make a big difference.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 "
          onClick={() =>
            setPeriod(period === "This month" ? "Last 6 months" : "This month")
          }
        >
          {period}
          <Icon name="down" size={16} />
        </button>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-4 max-[620px]:gap-2 ">
        <article className="flex flex-col gap-3 p-5 [&>strong]:text-xl [&>strong]:font-bold max-[620px]:gap-2 max-[620px]:px-3 max-[620px]:py-3 max-[620px]:[&>strong]:text-lg rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] ">
          <span className="text-[10px] font-bold tracking-[.8px] text-slate-400 ">
            TOTAL INCOME
          </span>
          <strong>
            {currency(analyticsIncome, profile.currency)}
          </strong>
          <small className="text-[11px] text-slate-400 max-[620px]:text-[9px] ">
            {period}
          </small>
        </article>
        <article className="flex flex-col gap-3 p-5 [&>strong]:text-xl [&>strong]:font-bold max-[620px]:gap-2 max-[620px]:px-3 max-[620px]:py-3 max-[620px]:[&>strong]:text-lg rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] ">
          <span className="text-[10px] font-bold tracking-[.8px] text-slate-400 ">
            TOTAL SPENDING
          </span>
          <strong>
            {currency(analyticsExpenses, profile.currency)}
          </strong>
          <small className="text-[11px] text-slate-400 max-[620px]:text-[9px] ">
            {period}
          </small>
        </article>
        <article className="flex flex-col gap-3 p-5 [&>strong]:text-xl [&>strong]:font-bold max-[620px]:gap-2 max-[620px]:px-3 max-[620px]:py-3 max-[620px]:[&>strong]:text-lg rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] ">
          <span className="text-[10px] font-bold tracking-[.8px] text-slate-400 ">
            SAVINGS RATE
          </span>
          <strong>
            {analyticsIncome
              ? `${Math.round(((analyticsIncome - analyticsExpenses) / analyticsIncome) * 100)}%`
              : "0%"}
          </strong>
          <small className="text-[11px] text-slate-400 max-[620px]:text-[9px] ">
            Of your income · {period.toLowerCase()}
          </small>
        </article>
      </div>
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] mb-4 p-5 max-[620px]:p-4 ">
        <div className="mb-5 flex items-center justify-between gap-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-800 [&_p]:mt-1 [&_p]:text-xs [&_p]:text-slate-400 dark:[&_h2]:text-slate-100 ">
          <div>
            <h2>Income vs. spending</h2>
            <p>
              {period === "This month"
                ? "This month’s money in and money out."
                : "A little progress, month by month."}
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500 [&_span]:inline-flex [&_span]:items-center [&_span]:gap-1.5 ">
            <span>
              <i className="inline-block size-2 rounded-full bg-violet-500 " />
              Income
            </span>
            <span>
              <i className="inline-block size-2 rounded-full bg-rose-400 " />
              Spending
            </span>
          </div>
        </div>
        <div className="flex min-h-[160px] flex-1 items-end justify-around gap-2 border-b border-l border-slate-100 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(25%-1px),#f1f1f6_calc(25%-1px),#f1f1f6_25%)] px-2 dark:border-slate-700 h-[260px] gap-3 max-[620px]:h-[200px] ">
          {analyticsData.map((item) => (
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
      </section>
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] p-5 max-[620px]:p-4 ">
        <div className="mb-5 flex items-center justify-between gap-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-800 [&_p]:mt-1 [&_p]:text-xs [&_p]:text-slate-400 dark:[&_h2]:text-slate-100 ">
          <div>
            <h2>Where it goes</h2>
            <p>Your spending by category this month.</p>
          </div>
        </div>
        <div className="grid grid-cols-[220px_1fr] items-center gap-8 max-[620px]:grid-cols-1 max-[620px]:justify-items-center ">
          <div
            className="grid size-[190px] place-items-center rounded-full [&>div]:grid [&>div]:size-[125px] [&>div]:content-center [&>div]:justify-items-center [&>div]:rounded-full [&>div]:bg-white dark:[&>div]:bg-[#191b25] [&_span]:text-xs [&_span]:text-slate-400 [&_strong]:text-sm "
            style={{ background: donutGradient }}
            role="img"
            aria-label={`Donut chart showing spending by category, total ${currency(categoryTotal, profile.currency)}`}
          >
            <div>
              <span>Total spent</span>
              <strong>{currency(categoryTotal, profile.currency)}</strong>
            </div>
          </div>
          <div className="grid gap-3 ">
            {chartCategories.map((item) => (
              <div className="flex items-center justify-between gap-5 border-b border-slate-100 pb-2 text-xs dark:border-slate-700 " key={item.category}>
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 [&_i]:size-2.5 [&_i]:rounded-full ">
                  <i style={{ backgroundColor: item.chartColor }} />
                  {item.category}
                </span>
                <strong>{currency(item.spent, profile.currency)}</strong>
              </div>
            ))}
            {chartCategories.length === 0 && (
              <p className="text-xs text-slate-400 ">
                Add a budget to see category spending here.
              </p>
            )}
          </div>
        </div>
      </section>
    </motion.section>
    </MotionConfig>
  );
}
