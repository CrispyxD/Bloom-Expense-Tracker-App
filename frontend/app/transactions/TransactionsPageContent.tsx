"use client";

import { motion, MotionConfig } from "framer-motion";
import { Icon, useDashboard } from "../components/DashboardApp";

export default function TransactionsPage() {
  const {
    openAddModal,
    search,
    setSearch,
    filterType,
    setFilterType,
    exportTransactions,
    filteredTransactions,
    renderTransactionsTable,
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
            YOUR MONEY, IN MOTION
          </p>
          <h1>
            Transactions
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-[620px]:max-w-[265px] max-[620px]:text-[11px] ">
            Every little detail, all in one place.
          </p>
        </div>
        <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 max-[620px]:min-h-9 max-[620px]:gap-1 max-[620px]:px-2.5 max-[620px]:text-[10px] " onClick={() => openAddModal()}>
          <Icon name="plus" size={18} />
          {" "}
          Add transaction
        </button>
      </div>
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] p-5 max-[620px]:px-2.5 max-[620px]:py-3 ">
        <div className="mb-4 flex items-center gap-3 max-[620px]:flex-wrap ">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-400 [&_input]:w-full [&_input]:border-0 [&_input]:bg-transparent [&_input]:text-sm [&_input]:outline-none dark:border-slate-700 dark:bg-slate-900 max-[620px]:basis-full ">
            <Icon name="search" size={18} />
            <input
              placeholder="Search transactions..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 "
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
          >
            <option>All</option>
            <option>Income</option>
            <option>Expense</option>
          </select>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 " onClick={exportTransactions}>
            <Icon name="download" size={17} />
            {" "}
            Export
          </button>
        </div>
        {renderTransactionsTable(filteredTransactions)}
      </section>
    </motion.section>
    </MotionConfig>
  );
}
