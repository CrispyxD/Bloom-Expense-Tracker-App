"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import {
  createContext,
  type Dispatch,
  type FormEvent,
  type RefObject,
  type ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type TransactionType = "income" | "expense";
type Transaction = {
  id: string;
  name: string;
  category: string;
  date: string;
  amount: number;
  type: TransactionType;
  note: string;
};
type Profile = {
  name: string;
  email: string;
  currency: string;
  monthlyIncome: number;
  avatar: string | null;
};
type Budget = {
  category: string;
  limit: number;
  color: string;
};
type SpendingCategory = Budget & { spent: number };
type ChartMonth = { month: string; income: number; expense: number };
type BudgetAlert = { id: string; category: string; spent: number; limit: number; percent: number };
type CalendarEntry = { note: string; holiday: boolean };
type CalendarEntries = Record<string, CalendarEntry>;

type DashboardContextValue = {
  transactions: Transaction[];
  profile: Profile;
  setProfile: Dispatch<SetStateAction<Profile>>;
  budgets: Budget[];
  activePage: PageName;
  theme: "light" | "dark";
  period: string;
  setPeriod: Dispatch<SetStateAction<string>>;
  filterType: string;
  setFilterType: Dispatch<SetStateAction<string>>;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  expenses: number;
  income: number;
  balance: number;
  previousIncome: number;
  previousExpenses: number;
  previousBalance: number;
  incomeChange: number | null;
  expensesChange: number | null;
  analyticsIncome: number;
  analyticsExpenses: number;
  chartData: ChartMonth[];
  visibleChartData: ChartMonth[];
  analyticsData: ChartMonth[];
  maxChart: number;
  spendingByCategory: SpendingCategory[];
  filteredTransactions: Transaction[];
  recentTransactions: Transaction[];
  budgetNotifications: BudgetAlert[];
  unreadNotificationCount: number;
  now: Date;
  showBalance: boolean;
  setShowBalance: Dispatch<SetStateAction<boolean>>;
  balanceMenuOpen: boolean;
  setBalanceMenuOpen: Dispatch<SetStateAction<boolean>>;
  balanceMenuRef: RefObject<HTMLDivElement | null>;
  notificationsOpen: boolean;
  setNotificationsOpen: Dispatch<SetStateAction<boolean>>;
  notificationPanelRef: RefObject<HTMLDivElement | null>;
  calendarOpen: boolean;
  setCalendarOpen: Dispatch<SetStateAction<boolean>>;
  calendarViewDate: Date;
  setCalendarViewDate: Dispatch<SetStateAction<Date>>;
  selectedCalendarDate: string;
  setSelectedCalendarDate: Dispatch<SetStateAction<string>>;
  calendarEntries: CalendarEntries;
  updateCalendarEntry: (date: string, entry: CalendarEntry) => void;
  calendarRef: RefObject<HTMLDivElement | null>;
  readNotificationIds: string[];
  setReadNotificationIds: Dispatch<SetStateAction<string[]>>;
  openAddModal: (type?: TransactionType) => void;
  editTransaction: (item: Transaction) => void;
  openBudgetModal: (category?: string) => void;
  toggleTheme: () => void;
  logout: () => void;
  saveProfile: (event: FormEvent<HTMLFormElement>) => void;
  exportTransactions: () => void;
  renderTransactionsTable: (items: Transaction[]) => ReactNode;
  navigateToPage: (page: PageName) => void;
  categoryIcon: (category: string) => string;
  currency: (amount: number, code: string, compact?: boolean) => string;
  initials: (name: string) => string;
  trend: (current: number, previous: number) => string;
  categories: string[];
  currencyOptions: ReadonlyArray<readonly [string, string]>;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("Dashboard page content must be rendered inside DashboardApp.");
  return context;
}

class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new Error("Could not reach the finance API. Make sure the backend is running on port 4000.");
  }

  if (response.status === 204) return undefined as T;
  const result = await response.json() as { message?: string };
  if (!response.ok) {
    throw new ApiError(result.message ?? "The request could not be completed.", response.status);
  }
  return result as T;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
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
type PageName = "Overview" | "Transactions" | "Analytics" | "Budgets" | "Profile";
const pagePaths: Record<PageName, string> = {
  Overview: "/",
  Transactions: "/transactions",
  Analytics: "/analytics",
  Budgets: "/budgets",
  Profile: "/profile",
};
const pageNamesByPath: Record<string, PageName> = {
  "/": "Overview",
  "/transactions": "Transactions",
  "/analytics": "Analytics",
  "/budgets": "Budgets",
  "/profile": "Profile",
};
const navigationItems: Array<[PageName, string]> = [
  ["Overview", "grid"],
  ["Transactions", "arrows"],
  ["Analytics", "chart"],
  ["Budgets", "wallet"],
  ["Profile", "user"],
];
export const currencyOptions = [
  ["USD", "US Dollar"],
  ["EUR", "Euro"],
  ["GBP", "British Pound"],
  ["CAD", "Canadian Dollar"],
  ["AUD", "Australian Dollar"],
  ["MMK", "Myanmar Kyat"],
  ["JPY", "Japanese Yen"],
  ["CNY", "Chinese Yuan"],
  ["INR", "Indian Rupee"],
  ["CHF", "Swiss Franc"],
  ["SGD", "Singapore Dollar"],
  ["HKD", "Hong Kong Dollar"],
  ["NZD", "New Zealand Dollar"],
  ["KRW", "South Korean Won"],
  ["THB", "Thai Baht"],
  ["MYR", "Malaysian Ringgit"],
  ["IDR", "Indonesian Rupiah"],
  ["PHP", "Philippine Peso"],
  ["VND", "Vietnamese Dong"],
  ["BDT", "Bangladeshi Taka"],
  ["PKR", "Pakistani Rupee"],
  ["NPR", "Nepalese Rupee"],
  ["LKR", "Sri Lankan Rupee"],
  ["KHR", "Cambodian Riel"],
  ["LAK", "Lao Kip"],
  ["AED", "UAE Dirham"],
  ["SAR", "Saudi Riyal"],
  ["QAR", "Qatari Riyal"],
  ["BHD", "Bahraini Dinar"],
  ["ZAR", "South African Rand"],
  ["NGN", "Nigerian Naira"],
  ["KES", "Kenyan Shilling"],
  ["EGP", "Egyptian Pound"],
  ["BRL", "Brazilian Real"],
  ["MXN", "Mexican Peso"],
  ["TRY", "Turkish Lira"],
  ["SEK", "Swedish Krona"],
  ["NOK", "Norwegian Krone"],
  ["DKK", "Danish Krone"],
  ["PLN", "Polish Zloty"],
] as const;
const initialProfile: Profile = {
  name: "Alex Morgan",
  email: "alex.morgan@email.com",
  currency: "USD",
  monthlyIncome: 5200,
  avatar: null,
};
const iconShapes: Record<string, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  arrows: <><path d="M7 7h12l-3-3" /><path d="m19 7-3 3" /><path d="M17 17H5l3 3" /><path d="m5 17 3-3" /></>,
  chart: <><path d="M4 19V5" /><path d="M4 19h17" /><path d="m7 15 4-4 3 2 6-7" /></>,
  wallet: <><rect x="3" y="5" width="18" height="15" rx="3" /><path d="M3 9h18" /><path d="M16 14h.01" /><path d="M6 5V3h12v2" /></>,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.42 0-8 2.58-8 5.75V21h16v-1.25C20 16.58 16.42 14 12 14Z" fill="currentColor" stroke="none" />,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  down: <><path d="m7 10 5 5 5-5" /></>,
  up: <><path d="m7 14 5-5 5 5" /></>,
  dots: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  leaf: <><path d="M20 4c-9 0-14 3-14 10a6 6 0 0 0 6 6c7 0 10-7 8-16Z" /><path d="M4 21c3-5 6-8 12-11" /></>,
  food: <><path d="M7 3v7" /><path d="M4 3v4a3 3 0 0 0 6 0V3" /><path d="M7 10v11" /><path d="M17 3v18" /><path d="M17 3c-3 2-3 7 0 8" /></>,
  home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
  car: <><path d="m5 11 2-6h10l2 6" /><path d="M3 11h18v7H3z" /><circle cx="7" cy="18" r="1.5" /><circle cx="17" cy="18" r="1.5" /></>,
  bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
  play: <><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4V8Z" /></>,
  heart: <><path d="M20.8 8.6c0 5-8.8 11-8.8 11s-8.8-6-8.8-11A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.2Z" /></>,
  edit: <><path d="m15 5 4 4" /><path d="m4 20 4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15v5Z" /></>,
  download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 20h14" /></>,
  close: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
  eyeOff: <><path d="m3 3 18 18" /><path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a13.7 13.7 0 0 1-2.2 2.8" /><path d="M6.6 6.9C4 8.5 2.5 12 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.2 3.3-.5" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
};

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {iconShapes[name] ?? iconShapes.grid}
    </svg>
  );
}

function currency(amount: number, code: string, compact = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(amount);
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function localDateInputValue(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "AM";
}

function categoryIcon(category: string) {
  if (category === "Food & drink") return "food";
  if (category === "Housing") return "home";
  if (category === "Transport") return "car";
  if (category === "Shopping") return "bag";
  if (category === "Entertainment") return "play";
  if (category === "Health") return "heart";
  return "wallet";
}

export default function DashboardApp({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState(initialProfile);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const activePage = pageNamesByPath[pathname] ?? "Overview";
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [period, setPeriod] = useState("Last 6 months");
  const [filterType, setFilterType] = useState("All");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState({ category: categories[0], limit: "250" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [balanceMenuOpen, setBalanceMenuOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date(2026, 9, 27));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState("2026-10-27");
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntries>({});
  const [calendarEntriesLoaded, setCalendarEntriesLoaded] = useState(false);
  const [calendarOwnerEmail, setCalendarOwnerEmail] = useState("");
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [notificationOwnerEmail, setNotificationOwnerEmail] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [dataLoading, setDataLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [currentDate, setCurrentDate] = useState("2026-10-27");
  const [draft, setDraft] = useState({
    name: "",
    category: "Food & drink",
    date: "2026-10-27",
    amount: "",
    type: "expense" as TransactionType,
    note: "",
  });
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const balanceMenuRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  function navigateToPage(page: PageName) {
    router.push(pagePaths[page]);
  }

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("bloom-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      const themeTimer = window.setTimeout(() => setTheme(savedTheme), 0);
      return () => window.clearTimeout(themeTimer);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const dateTimer = window.setTimeout(() => {
      const current = new Date(`${currentDate}T12:00:00`);
      setSelectedCalendarDate(currentDate);
      setCalendarViewDate(current);
    }, 0);
    return () => window.clearTimeout(dateTimer);
  }, [currentDate]);

  useEffect(() => {
    let active = true;
    const dateTimer = window.setTimeout(() => setCurrentDate(localDateInputValue()), 0);
    apiRequest<{ user: Profile }>("/api/auth/me")
      .then(({ user }) => {
        if (!active) return;
        setProfile(user);
        setDataLoading(true);
        setIsAuthenticated(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) return;
        setApiError(error instanceof Error ? error.message : "Could not connect to the backend.");
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => {
      active = false;
      window.clearTimeout(dateTimer);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    Promise.all([
      apiRequest<{ profile: Profile }>("/api/profile"),
      apiRequest<{ transactions: Transaction[] }>("/api/transactions"),
      apiRequest<{ budgets: Budget[] }>("/api/budgets"),
    ])
      .then(([profileResult, transactionResult, budgetResult]) => {
        if (!active) return;
        setProfile(profileResult.profile);
        setTransactions(transactionResult.transactions);
        setBudgets(budgetResult.budgets);
      })
      .catch((error: unknown) => {
        if (active) setApiError(error instanceof Error ? error.message : "Could not load your finance data.");
      })
      .finally(() => {
        if (active) setDataLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !profile.email) return;
    let active = true;
    const timer = window.setTimeout(() => {
      try {
        const savedIds = window.localStorage.getItem(`bloom-notifications-read:${profile.email}`);
        if (active && savedIds) setReadNotificationIds(JSON.parse(savedIds) as string[]);
        else if (active) setReadNotificationIds([]);
      } catch (error) {
        console.error("Could not load notification preferences.", error);
        if (active) setReadNotificationIds([]);
      } finally {
        if (active) {
          setNotificationsLoaded(true);
          setNotificationOwnerEmail(profile.email);
        }
      }
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isAuthenticated, profile.email]);

  useEffect(() => {
    if (!isAuthenticated || !notificationsLoaded || notificationOwnerEmail !== profile.email) return;
    try {
      window.localStorage.setItem(
        `bloom-notifications-read:${profile.email}`,
        JSON.stringify(readNotificationIds),
      );
    } catch (error) {
      console.error("Could not save notification preferences.", error);
    }
  }, [isAuthenticated, notificationsLoaded, notificationOwnerEmail, profile.email, readNotificationIds]);

  useEffect(() => {
    if (!isAuthenticated || !profile.email) return;
    let active = true;
    const timer = window.setTimeout(() => {
      try {
        const savedEntries = window.localStorage.getItem(`bloom-calendar:${profile.email}`);
        const parsedEntries: unknown = savedEntries ? JSON.parse(savedEntries) : {};
        if (
          parsedEntries === null ||
          typeof parsedEntries !== "object" ||
          Array.isArray(parsedEntries)
        ) {
          throw new Error("Saved calendar entries have an invalid format.");
        }
        const validEntries = Object.fromEntries(
          Object.entries(parsedEntries).filter(
            (entry): entry is [string, CalendarEntry] =>
              /^\d{4}-\d{2}-\d{2}$/.test(entry[0]) &&
              typeof entry[1] === "object" &&
              entry[1] !== null &&
              typeof entry[1].note === "string" &&
              typeof entry[1].holiday === "boolean",
          ),
        );
        if (active) setCalendarEntries(validEntries);
      } catch (error) {
        console.error("Could not load calendar entries.", error);
        if (active) setCalendarEntries({});
      } finally {
        if (active) {
          setCalendarEntriesLoaded(true);
          setCalendarOwnerEmail(profile.email);
        }
      }
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isAuthenticated, profile.email]);

  useEffect(() => {
    if (
      !isAuthenticated ||
      !calendarEntriesLoaded ||
      calendarOwnerEmail !== profile.email
    ) return;
    try {
      window.localStorage.setItem(
        `bloom-calendar:${profile.email}`,
        JSON.stringify(calendarEntries),
      );
    } catch (error) {
      console.error("Could not save calendar entries.", error);
      toast.error("Could not save your calendar changes in this browser.");
    }
  }, [isAuthenticated, calendarEntriesLoaded, calendarOwnerEmail, profile.email, calendarEntries]);

  useEffect(() => {
    if (!notificationsOpen && !balanceMenuOpen && !calendarOpen) return;
    function dismissMenus(event: MouseEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent && event.key === "Escape") {
        setNotificationsOpen(false);
        setBalanceMenuOpen(false);
        setCalendarOpen(false);
        return;
      }
      if (event instanceof MouseEvent && event.target instanceof Node) {
        if (!notificationPanelRef.current?.contains(event.target)) setNotificationsOpen(false);
        if (!balanceMenuRef.current?.contains(event.target)) setBalanceMenuOpen(false);
        if (!calendarRef.current?.contains(event.target)) setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", dismissMenus);
    document.addEventListener("keydown", dismissMenus);
    return () => {
      document.removeEventListener("mousedown", dismissMenus);
      document.removeEventListener("keydown", dismissMenus);
    };
  }, [notificationsOpen, balanceMenuOpen, calendarOpen]);

  function updateCalendarEntry(date: string, entry: CalendarEntry) {
    setCalendarEntries((currentEntries) => {
      const nextEntries = { ...currentEntries };
      if (!entry.note.trim() && !entry.holiday) {
        delete nextEntries[date];
      } else {
        nextEntries[date] = entry;
      }
      return nextEntries;
    });
  }

  const now = new Date(`${currentDate}T12:00:00`);
  const thisMonth = transactions.filter((item) => {
    const date = new Date(`${item.date}T12:00:00`);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const income = thisMonth.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expenses = thisMonth.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const balance = income - expenses;
  const chartData = useMemo(() => {
    const chartNow = new Date(`${currentDate}T12:00:00`);
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(chartNow.getFullYear(), chartNow.getMonth() - 5 + index, 1);
      const monthlyTransactions = transactions.filter((item) => {
        const itemDate = new Date(`${item.date}T12:00:00`);
        return itemDate.getMonth() === date.getMonth() && itemDate.getFullYear() === date.getFullYear();
      });
      return {
        month: date.toLocaleDateString("en-US", { month: "short" }),
        income: monthlyTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0),
        expense: monthlyTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0),
      };
    });
  }, [transactions, currentDate]);
  const visibleChartData = period === "This month" ? chartData.slice(-1) : chartData;
  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...transactions]
      .filter((item) => filterType === "All" || item.type === filterType.toLowerCase())
      .filter((item) => !query || `${item.name} ${item.category} ${item.note}`.toLowerCase().includes(query))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filterType, search]);
  const recentTransactions = [...thisMonth].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const spendingByCategory = budgets.map((budget) => ({
    ...budget,
    spent: thisMonth
      .filter((item) => item.type === "expense" && item.category === budget.category)
      .reduce((sum, item) => sum + item.amount, 0),
  }));
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthTransactions = transactions.filter((item) => {
    const date = new Date(`${item.date}T12:00:00`);
    return date.getMonth() === previousMonth.getMonth() && date.getFullYear() === previousMonth.getFullYear();
  });
  const previousIncome = previousMonthTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const previousExpenses = previousMonthTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const previousBalance = previousIncome - previousExpenses;
  const budgetNotifications = spendingByCategory
    .filter((item) => item.limit > 0 && item.spent / item.limit >= 0.8)
    .map((item) => ({
      id: `${now.getFullYear()}-${now.getMonth()}-${item.category}`,
      category: item.category,
      spent: item.spent,
      limit: item.limit,
      percent: Math.round((item.spent / item.limit) * 100),
    }));
  const unreadNotificationCount = budgetNotifications.filter((item) => !readNotificationIds.includes(item.id)).length;
  const maxChart = Math.max(1, ...chartData.flatMap((item) => [item.income, item.expense]));

  function trend(current: number, previous: number) {
    if (previous <= 0) return "No previous month";
    const change = Math.round(((current - previous) / previous) * 100);
    return `${change > 0 ? "+" : ""}${change}% vs. last month`;
  }

  function changePercent(current: number, previous: number) {
    return previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
  }

  const incomeChange = changePercent(income, previousIncome);
  const expensesChange = changePercent(expenses, previousExpenses);
  const analyticsData = period === "This month" ? chartData.slice(-1) : chartData;
  const analyticsIncome = analyticsData.reduce((sum, item) => sum + item.income, 0);
  const analyticsExpenses = analyticsData.reduce((sum, item) => sum + item.expense, 0);

  function goToNotifications() {
    navigateToPage("Budgets");
    setNotificationsOpen(false);
    setReadNotificationIds((current) => Array.from(new Set([
      ...current,
      ...budgetNotifications.map((item) => item.id),
    ])));
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setApiError("");
    try {
      const path = authMode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = authMode === "register"
        ? authForm
        : { email: authForm.email, password: authForm.password };
      const result = await apiRequest<{ user: Profile }>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setProfile(result.user);
      setNotificationOwnerEmail("");
      setNotificationsLoaded(false);
      setReadNotificationIds([]);
      setDataLoading(true);
      setIsAuthenticated(true);
      setAuthForm({ name: "", email: "", password: "" });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function logout() {
    try {
      await apiRequest<void>("/api/auth/logout", { method: "POST" });
      setIsAuthenticated(false);
      setTransactions([]);
      setBudgets([]);
      setProfile(initialProfile);
      setNotificationOwnerEmail("");
      setNotificationsLoaded(false);
      setReadNotificationIds([]);
      navigateToPage("Overview");
      setApiError("");
      toast.success("You have been signed out.");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Could not sign out.");
    }
  }

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    window.localStorage.setItem("bloom-theme", nextTheme);
    setTheme(nextTheme);
  }

  function openAddModal(type: TransactionType = "expense") {
    setEditingId(null);
    setDraft({ name: "", category: type === "income" ? "Salary" : "Food & drink", date: localDateInputValue(), amount: "", type, note: "" });
    setIsModalOpen(true);
  }

  function editTransaction(item: Transaction) {
    setEditingId(item.id);
    setDraft({ name: item.name, category: item.category, date: item.date, amount: String(item.amount), type: item.type, note: item.note });
    setIsModalOpen(true);
  }

  async function saveTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(draft.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter an amount greater than zero.");
      return;
    }
    if (!draft.name.trim()) {
      toast.error("Add a name for this transaction.");
      return;
    }
    const body = {
      ...draft,
      name: draft.name.trim(),
      note: draft.note.trim(),
      amount,
    };
    try {
      const path = editingId ? `/api/transactions/${encodeURIComponent(editingId)}` : "/api/transactions";
      const result = await apiRequest<{ transaction: Transaction }>(path, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      setTransactions((current) => editingId
        ? current.map((item) => item.id === editingId ? result.transaction : item)
        : [result.transaction, ...current]);
      setIsModalOpen(false);
      const transactionType = result.transaction.type === "income" ? "Income" : "Expense";
      toast.success(`${transactionType} ${editingId ? "updated" : "added"}.`);
      setApiError("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save this transaction.";
      setApiError(message);
      toast.error(message);
    }
  }

  async function deleteTransaction(id: string) {
    const transaction = transactions.find((item) => item.id === id);
    try {
      await apiRequest<void>(`/api/transactions/${encodeURIComponent(id)}`, { method: "DELETE" });
      setTransactions((current) => current.filter((item) => item.id !== id));
      toast.success(`${transaction?.type === "income" ? "Income" : "Expense"} deleted.`);
      setApiError("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not remove this transaction.";
      setApiError(message);
      toast.error(message);
    }
  }

  function exportTransactions() {
    const rows = [
      ["Date", "Name", "Category", "Type", "Amount", "Note"],
      ...filteredTransactions.map((item) => [item.date, item.name, item.category, item.type, String(item.amount), item.note]),
    ];
    const csv = rows.map((row) => row.map((field) => `"${field.replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "bloom-transactions.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Your transactions are ready to download.");
  }

  function openBudgetModal(category = categories[0]) {
    const existing = budgets.find((item) => item.category === category);
    setBudgetDraft({ category, limit: String(existing?.limit ?? 250) });
    setApiError("");
    setIsBudgetModalOpen(true);
  }

  async function saveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const category = budgetDraft.category;
    const limit = Number(budgetDraft.limit);
    if (!categories.includes(category) || !Number.isFinite(limit) || limit <= 0) {
      toast.error("Choose a category and enter a budget greater than zero.");
      return;
    }
    const existing = budgets.find((item) => item.category === category);
    const color = existing?.color ?? "#7b72e9";
    setBudgetSaving(true);
    try {
      const result = await apiRequest<{ budget: Budget }>(`/api/budgets/${encodeURIComponent(category)}`, {
        method: "PUT",
        body: JSON.stringify({ limit, color }),
      });
      setBudgets((current) => [
        ...current.filter((item) => item.category !== category),
        result.budget,
      ].sort((a, b) => a.category.localeCompare(b.category)));
      setIsBudgetModalOpen(false);
      toast.success(`${category} budget ${existing ? "updated" : "added"}.`);
      setApiError("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save this budget.";
      setApiError(message);
      toast.error(message);
    } finally {
      setBudgetSaving(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = await apiRequest<{ profile: Profile }>("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: profile.name,
          currency: profile.currency,
          monthlyIncome: profile.monthlyIncome,
          avatar: profile.avatar,
        }),
      });
      setProfile(result.profile);
      toast.success("Your profile has been saved.");
      setApiError("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save your profile.";
      setApiError(message);
      toast.error(message);
    }
  }

  function renderTransactionsTable(items: Transaction[]) {
    return (
      <div className="w-full overflow-x-auto ">
        <table className="w-full border-collapse text-left text-xs [&_th]:h-8.5 [&_th]:border-b [&_th]:border-slate-100 [&_th]:text-[9px] [&_th]:font-semibold [&_th]:tracking-wide [&_th]:text-slate-400 [&_td]:h-13.5 [&_td]:border-b [&_td]:border-slate-100 [&_td]:text-[11px] [&_td]:text-slate-500 [&_tr:last-child_td]:border-b-0 [&_tr:hover]:bg-slate-50 dark:[&_th]:border-slate-700 dark:[&_td]:border-slate-700 dark:[&_td]:text-slate-300 dark:[&_tr:hover]:bg-slate-800 max-[620px]:[&_th:nth-child(2)]:hidden max-[620px]:[&_td:nth-child(2)]:hidden ">
          <thead><tr><th>TRANSACTION</th><th>CATEGORY</th><th>DATE</th><th>AMOUNT</th><th aria-label="Actions" /></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td><div className="flex min-w-45 items-center gap-2.5 [&>span:last-child]:grid [&>span:last-child]:gap-1 [&_strong]:text-[11px] [&_strong]:font-semibold [&_strong]:text-slate-700 [&_small]:text-[10px] [&_small]:text-slate-400 max-[620px]:min-w-37.5 max-[620px]:gap-2 "><span className="grid size-8.25 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600 max-[620px]:size-7.5"><Icon name={categoryIcon(item.category)} size={18} /></span><span><strong>{item.name}</strong><small>{item.note || (item.type === "income" ? "Income" : "Expense")}</small></span></div></td>
                <td><span className="whitespace-nowrap rounded-md bg-slate-50 px-2 py-1 text-[10px] text-slate-500 ">{item.category}</span></td>
                <td className="whitespace-nowrap text-[11px] max-[620px]:text-[10px] ">{formatDate(item.date)}</td>
                <td className={item.type === "income" ? "font-semibold text-emerald-600 " : "font-semibold text-rose-500 "}>{item.type === "income" ? "+" : "−"}{currency(item.amount, profile.currency)}</td>
                <td><div className="flex justify-end opacity-20 transition-opacity hover:opacity-100 [&_.icon-button]:size-6.75 "><button className="relative inline-grid size-8.5 shrink-0 place-items-center rounded-lg bg-transparent text-slate-500 transition hover:bg-violet-50 hover:text-violet-700 active:scale-95 dark:text-slate-300 dark:hover:bg-violet-950/50 " aria-label={`Edit ${item.name}`} onClick={() => editTransaction(item)}><Icon name="edit" size={16} /></button><button className="relative inline-grid size-8.5 shrink-0 place-items-center rounded-lg bg-transparent text-slate-500 transition hover:bg-violet-50 hover:text-violet-700 active:scale-95 dark:text-slate-300 dark:hover:bg-violet-950/50 hover:bg-rose-50 hover:text-rose-600 " aria-label={`Delete ${item.name}`} onClick={() => deleteTransaction(item.id)}><Icon name="close" size={16} /></button></div></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td className="py-10 text-center text-sm text-slate-400 " colSpan={5}>No transactions found. Try a different search or add one.</td></tr>}
          </tbody>
        </table>
      </div>
    );
  }

  const pageContextValue: DashboardContextValue = {
    transactions,
    profile,
    setProfile,
    budgets,
    activePage,
    theme,
    period,
    setPeriod,
    filterType,
    setFilterType,
    search,
    setSearch,
    expenses,
    income,
    balance,
    previousIncome,
    previousExpenses,
    previousBalance,
    incomeChange,
    expensesChange,
    analyticsIncome,
    analyticsExpenses,
    chartData,
    visibleChartData,
    analyticsData,
    maxChart,
    spendingByCategory,
    filteredTransactions,
    recentTransactions,
    budgetNotifications,
    unreadNotificationCount,
    now,
    showBalance,
    setShowBalance,
    balanceMenuOpen,
    setBalanceMenuOpen,
    balanceMenuRef,
    notificationsOpen,
    setNotificationsOpen,
    notificationPanelRef,
    calendarOpen,
    setCalendarOpen,
    calendarViewDate,
    setCalendarViewDate,
    selectedCalendarDate,
    setSelectedCalendarDate,
    calendarEntries,
    updateCalendarEntry,
    calendarRef,
    readNotificationIds,
    setReadNotificationIds,
    openAddModal,
    editTransaction,
    openBudgetModal,
    toggleTheme,
    logout,
    saveProfile,
    exportTransactions,
    renderTransactionsTable,
    navigateToPage,
    categoryIcon,
    currency,
    initials,
    trend,
    categories,
    currencyOptions,
  };

  const calendarYear = calendarViewDate.getFullYear();
  const calendarMonth = calendarViewDate.getMonth();
  const calendarDaysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarStartDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const calendarCells = Array.from(
    { length: Math.ceil((calendarStartDay + calendarDaysInMonth) / 7) * 7 },
    (_, index) => {
      const day = index - calendarStartDay + 1;
      return day > 0 && day <= calendarDaysInMonth ? day : null;
    },
  );
  const selectedCalendarEntry = calendarEntries[selectedCalendarDate] ?? {
    note: "",
    holiday: false,
  };

  if (!authReady || (isAuthenticated && dataLoading)) {
    return (
      <MotionConfig reducedMotion="user">
        <motion.main
          className="grid min-h-screen place-items-center bg-[#f7f8fc] p-6 dark:bg-[#11131a] max-[620px]:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.section
            className="grid w-full max-w-[440px] justify-items-center gap-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-[#191b25] max-[620px]:p-6"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.28, ease: [0.2, 0.75, 0.25, 1] }}
          >
            <a className="flex items-center gap-2.5 text-[22px] font-bold tracking-tight text-slate-800 dark:text-slate-100" href="#">
              <span className="grid size-8 place-items-center rounded-lg bg-violet-100">
                <Image src="/bloom-mark.svg" alt="" width={25} height={25} />
              </span>
              <span>bloom<span className="text-violet-500">.</span></span>
            </a>
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-300" role="status" aria-live="polite">
              <motion.span
                className="size-5 rounded-full border-2 border-violet-200 border-t-violet-600 dark:border-violet-900 dark:border-t-violet-300"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
                aria-hidden="true"
              />
              {authReady ? "Loading your finance data…" : "Connecting to Bloom…"}
            </div>
          </motion.section>
        </motion.main>
      </MotionConfig>
    );
  }

  if (!isAuthenticated) {
    return (
      <MotionConfig reducedMotion="user">
        <motion.main className="grid min-h-screen place-items-center bg-[#f7f8fc] p-6 dark:bg-[#11131a] max-[620px]:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          <motion.section className="w-full max-w-[440px] rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-[#191b25] [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold max-[620px]:p-6 " initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.28, ease: [0.2, 0.75, 0.25, 1] }}>
            <a className="flex items-center gap-2.5 px-3 text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 max-[800px]:px-0 mb-8 justify-center px-0 text-[22px] " href="#"><span className="grid size-8 place-items-center rounded-lg bg-violet-100 "><Image src="/bloom-mark.svg" alt="" width={25} height={25} /></span><span>bloom<span className="text-violet-500 ">.</span></span></a>
            <p className="mb-2 text-[10px] font-bold tracking-[1.2px] text-violet-600 dark:text-violet-300 ">{authMode === "register" ? "A FRESH START" : "WELCOME BACK"}</p>
            <h1>{authMode === "register" ? "Make space for what matters." : "Your money, in balance."}</h1>
            <p className="mb-6 text-center text-sm text-slate-500 ">{authMode === "register" ? "Create your private account and start your money journey." : "Sign in to pick up right where you left off."}</p>
            {(apiError || authError) && <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 " role="alert">{authError || apiError}</div>}
            <form className="grid gap-4 [&_label]:grid [&_label]:gap-2 [&_label]:text-xs [&_label]:font-semibold [&_label]:text-slate-600 [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-200 [&_input]:bg-white [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-sm dark:[&_input]:border-slate-700 dark:[&_input]:bg-slate-900 " onSubmit={submitAuth}>
              {authMode === "register" && <label>FULL NAME<input autoComplete="name" value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} minLength={1} maxLength={80} required /></label>}
              <label>EMAIL ADDRESS<input type="email" autoComplete="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} maxLength={254} required /></label>
              <label>PASSWORD
                <div className="relative">
                  <input className="w-full pr-10!" type={showPassword ? "text" : "password"} autoComplete={authMode === "register" ? "new-password" : "current-password"} value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} minLength={8} maxLength={128} required />
                  <button className="absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:bg-slate-800 dark:hover:text-slate-200" type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>
                    <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
                  </button>
                </div>
                <small>{authMode === "register" ? "Use at least 8 characters." : "At least 8 characters."}</small>
              </label>
              <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 max-[620px]:min-h-9 max-[620px]:gap-1 max-[620px]:px-2.5 max-[620px]:text-[10px] w-full justify-center " type="submit" disabled={authLoading}>{authLoading ? "Please wait…" : authMode === "register" ? "Create account" : "Sign in"}</button>
            </form>
            <p className="mt-5 text-center text-xs text-violet-700 dark:text-violet-300 ">{authMode === "register" ? "Already have an account?" : "New to Bloom?"}{" "}<button onClick={() => { setAuthMode(authMode === "register" ? "login" : "register"); setShowPassword(false); setAuthError(""); }}>{authMode === "register" ? "Sign in" : "Create an account"}</button></p>
            <p className="mt-5 text-center text-[11px] text-slate-400 ">Your finance data is private to your account.</p>
            {apiError && <button className="mt-3 rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-200 " onClick={() => window.location.reload()}>Retry connection</button>}
          </motion.section>
        </motion.main>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <>
        <DashboardContext.Provider value={pageContextValue}>
          <div className="min-h-screen bg-[#f7f8fc] text-[#24243a] dark:bg-[#11131a] dark:text-[#e7e8f0] ">
            <aside className="fixed inset-y-0 left-0 z-30 flex w-[248px] flex-col border-r border-slate-200 bg-white px-[18px] py-7 transition-colors dark:border-[#2d303c] dark:bg-[#191b25] max-[800px]:static max-[800px]:h-auto max-[800px]:w-full max-[800px]:flex-row max-[800px]:items-center max-[800px]:justify-between max-[800px]:border-r-0 max-[800px]:border-b max-[800px]:px-4 max-[800px]:py-3 max-[620px]:items-start max-[620px]:flex-col ">
              <a className="flex items-center gap-2.5 px-3 text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 max-[800px]:px-0 " href={pagePaths.Overview} onClick={(event) => { event.preventDefault(); navigateToPage("Overview"); }}>
                <span className="grid size-8 place-items-center rounded-lg bg-violet-100 "><Image src="/bloom-mark.svg" alt="" width={25} height={25} /></span><span>bloom<span className="text-violet-500 ">.</span></span>
              </a>
              <div className="mb-3 mt-12 px-3 text-[11px] font-bold tracking-widest text-slate-400 max-[800px]:hidden ">WORKSPACE</div>
              <nav className="grid gap-1 max-[800px]:ml-4 max-[800px]:flex-1 max-[800px]:grid-cols-5 max-[800px]:overflow-visible max-[620px]:ml-0 max-[620px]:w-full " aria-label="Main navigation">
                {navigationItems.map(([label, icon]) => (
                  <button key={label} className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-slate-500 transition hover:bg-violet-50 hover:text-violet-700 dark:text-slate-300 dark:hover:bg-violet-950/50 dark:hover:text-violet-200 max-[800px]:h-[45px] max-[800px]:flex-col max-[800px]:justify-center max-[800px]:gap-1 max-[800px]:px-0.5 max-[800px]:text-[10px] max-[620px]:h-[47px] ${activePage === label ? "bg-violet-50 font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-200" : ""} `} onClick={() => navigateToPage(label)}>
                    <Icon name={icon} size={19} /><span>{label}</span>{label === "Transactions" && <span className="ml-auto rounded-md bg-slate-50 px-2 py-0.5 text-[11px] text-slate-400 dark:bg-slate-800 dark:text-slate-300 max-[800px]:hidden ">{transactions.length}</span>}
                  </button>
                ))}
              </nav>
              <div className="mt-auto max-[800px]:hidden ">
                <button className="flex w-full items-center gap-2.5 border-t border-slate-100 bg-transparent px-1 py-3 text-left text-slate-600 dark:border-slate-700 dark:text-slate-300 " onClick={() => navigateToPage("Profile")}>
                  <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-violet-100 text-sm font-bold text-violet-700 [&_img]:size-full [&_img]:object-cover ">{profile.avatar ? <Image src={profile.avatar} alt="" width={36} height={36} unoptimized /> : initials(profile.name)}</span><span className="grid flex-1 gap-1 text-xs [&_strong]:font-semibold [&_small]:text-slate-400 "><strong>{profile.name}</strong><small>Personal account</small></span><Icon name="dots" size={18} />
                </button>
              </div>
            </aside>

            <main className="ml-[248px] min-h-screen max-[800px]:ml-0 ">
              <header className="sticky top-0 z-20 flex h-[69px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-11 backdrop-blur-xl dark:border-slate-700 dark:bg-[#191b25]/95 max-[1100px]:px-7 max-[800px]:static max-[800px]:h-[55px] max-[800px]:px-5 max-[620px]:px-4 ">
                <div className="flex items-center gap-3 text-sm text-slate-400 [&_strong]:font-semibold [&_strong]:text-slate-700 dark:[&_strong]:text-slate-100 "><span>Workspace</span><span className="text-slate-300 ">/</span><strong>{activePage}</strong></div>
                <div className="flex items-center gap-5 max-[620px]:gap-3 ">
                  <div
                    className={`relative${calendarOpen ? " z-50" : ""} `}
                    ref={calendarRef}
                  >
                    <button
                      className="text-xs text-slate-500 flex items-center gap-2 rounded-lg border-0 bg-transparent px-2 py-1.5 text-xs text-slate-500 hover:bg-violet-50 hover:text-violet-700 dark:text-slate-300 dark:hover:bg-violet-950/50 max-[620px]:text-[10px] "
                      type="button"
                      aria-label="Open calendar"
                      aria-haspopup="dialog"
                      aria-expanded={calendarOpen}
                      aria-controls="interactive-calendar"
                      onClick={() => {
                        setCalendarOpen((open) => !open);
                        setNotificationsOpen(false);
                        setBalanceMenuOpen(false);
                      }}
                    >
                      <Icon name="calendar" size={16} />
                      {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      <Icon name="down" size={13} />
                    </button>
                    <AnimatePresence>
                      {calendarOpen && (
                        <motion.section
                          className="absolute right-0 top-[calc(100%+13px)] z-50 w-[min(330px,calc(100vw-24px))] rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-[#191b25] rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] "
                          id="interactive-calendar"
                          role="dialog"
                          aria-label="Calendar and date notes"
                          initial={{ opacity: 0, y: -5, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -5, scale: 0.96 }}
                          transition={{ duration: 0.18, ease: [0.2, 0.75, 0.25, 1] }}
                        >
                          <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-100 ">
                            <button
                              className="grid size-[30px] place-items-center rounded-lg bg-transparent text-slate-500 hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-950/50 [&_svg]:rotate-90"
                              type="button"
                              aria-label="Previous month"
                              onClick={() =>
                                setCalendarViewDate(
                                  new Date(calendarYear, calendarMonth - 1, 1),
                                )
                              }
                            >
                              <Icon name="down" size={16} />
                            </button>
                            <strong>
                              {calendarViewDate.toLocaleDateString("en-US", {
                                month: "long",
                                year: "numeric",
                              })}
                            </strong>
                            <button
                              className="grid size-[30px] place-items-center rounded-lg bg-transparent text-slate-500 hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-950/50 [&_svg]:-rotate-90 "
                              type="button"
                              aria-label="Next month"
                              onClick={() =>
                                setCalendarViewDate(
                                  new Date(calendarYear, calendarMonth + 1, 1),
                                )
                              }
                            >
                              <Icon name="down" size={16} />
                            </button>
                          </div>
                          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] text-slate-400 [&_span]:py-1 " aria-hidden="true">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((weekday) => (
                              <span key={weekday}>{weekday}</span>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-1 ">
                            {calendarCells.map((day, index) => {
                              if (day === null) {
                                return <span className="min-h-[34px] " key={`empty-${index}`} />;
                              }
                              const date = localDateInputValue(
                                new Date(calendarYear, calendarMonth, day, 12),
                              );
                              const entry = calendarEntries[date];
                              const isSelected = date === selectedCalendarDate;
                              const isToday = date === currentDate;

                              return (
                                <button
                                  className={`relative grid min-h-[34px] min-w-0 place-items-center rounded-lg border border-transparent bg-transparent text-xs text-slate-700 transition hover:-translate-y-px hover:bg-violet-50 hover:text-violet-700 dark:text-slate-200 dark:hover:bg-violet-950/50${isSelected ? " border-violet-600 bg-violet-600 text-white hover:bg-violet-600 hover:text-white" : ""}${isToday ? " border-violet-200 font-bold text-violet-700" : ""}${entry?.holiday ? " bg-orange-50 text-orange-700" : ""} `}
                                  type="button"
                                  key={date}
                                  aria-label={`${new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { dateStyle: "full" })}${entry?.holiday ? ", holiday" : ""}${entry?.note ? ", has a note" : ""}`}
                                  aria-pressed={isSelected}
                                  onClick={() => setSelectedCalendarDate(date)}
                                >
                                  {day}
                                  {(entry?.holiday || entry?.note) && (
                                    <span
                                      className={`absolute bottom-1 size-1 rounded-full bg-violet-500${entry.holiday ? " bg-orange-500" : ""} `}
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 dark:border-slate-700 [&_strong]:text-sm [&_strong]:text-slate-700 dark:[&_strong]:text-slate-100 ">
                            <strong>
                              {new Date(`${selectedCalendarDate}T12:00:00`).toLocaleDateString(
                                "en-US",
                                { weekday: "long", month: "long", day: "numeric" },
                              )}
                            </strong>
                            {calendarEntriesLoaded &&
                              calendarOwnerEmail === profile.email ? (
                              <>
                                <button
                                  className={`flex items-center gap-2 text-xs text-slate-500${selectedCalendarEntry.holiday ? " font-semibold text-orange-700" : ""} `}
                                  type="button"
                                  aria-pressed={selectedCalendarEntry.holiday}
                                  onClick={() =>
                                    updateCalendarEntry(selectedCalendarDate, {
                                      ...selectedCalendarEntry,
                                      holiday: !selectedCalendarEntry.holiday,
                                    })
                                  }
                                >
                                  <span className="size-3 rounded-full border border-slate-300 " />
                                  {selectedCalendarEntry.holiday
                                    ? "Marked as a holiday"
                                    : "Mark as a holiday"}
                                </button>
                                <label className="grid gap-2 text-xs font-medium text-slate-500 [&_textarea]:min-h-20 [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-slate-200 [&_textarea]:p-2 dark:[&_textarea]:border-slate-700 dark:[&_textarea]:bg-slate-900 ">
                                  Note
                                  <textarea
                                    value={selectedCalendarEntry.note}
                                    maxLength={500}
                                    placeholder="Add a reminder or note..."
                                    onChange={(event) =>
                                      updateCalendarEntry(selectedCalendarDate, {
                                        ...selectedCalendarEntry,
                                        note: event.target.value,
                                      })
                                    }
                                  />
                                  <small>
                                    Saved automatically · {selectedCalendarEntry.note.length}/500
                                  </small>
                                </label>
                              </>
                            ) : (
                              <p className="text-xs text-slate-400 ">Loading your saved dates…</p>
                            )}
                          </div>
                        </motion.section>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="relative " ref={notificationPanelRef}>
                    <button
                      className="relative inline-grid size-[34px] shrink-0 place-items-center rounded-lg bg-transparent text-slate-500 transition hover:bg-violet-50 hover:text-violet-700 active:scale-95 dark:text-slate-300 dark:hover:bg-violet-950/50 relative "
                      aria-label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread` : ""}`}
                      aria-expanded={notificationsOpen}
                      aria-controls="notification-panel"
                      onClick={() => {
                        setNotificationsOpen((open) => !open);
                        setBalanceMenuOpen(false);
                      }}
                    >
                      <Icon name="bell" size={19} />
                      {unreadNotificationCount > 0 && <i />}
                      {unreadNotificationCount > 0 && <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-rose-500 text-[9px] text-white ">{unreadNotificationCount}</span>}
                    </button>
                    <AnimatePresence>
                      {notificationsOpen && (
                        <motion.section className="absolute right-0 top-[calc(100%+13px)] z-50 w-[min(330px,calc(100vw-24px))] rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-[#191b25] rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] " id="notification-panel" aria-label="Notifications" initial={{ opacity: 0, y: -5, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -5, scale: 0.96 }} transition={{ duration: 0.18, ease: [0.2, 0.75, 0.25, 1] }}>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm [&_div]:grid [&_div]:gap-1 [&_small]:text-[11px] [&_small]:text-slate-400 dark:border-slate-700 ">
                            <div><strong>Notifications</strong><small>{unreadNotificationCount ? `${unreadNotificationCount} unread alert${unreadNotificationCount === 1 ? "" : "s"}` : "You’re all caught up"}</small></div>
                            <button className="text-[11px] font-medium text-violet-700 disabled:opacity-40 dark:text-violet-300 " disabled={!unreadNotificationCount} onClick={() => setReadNotificationIds((current) => Array.from(new Set([...current, ...budgetNotifications.map((item) => item.id)])))}>Mark all read</button>
                          </div>
                          {budgetNotifications.length ? (
                            <div className="grid divide-y divide-slate-100 dark:divide-slate-700 ">
                              {budgetNotifications.map((item) => {
                                const isRead = readNotificationIds.includes(item.id);
                                return (
                                  <button
                                    className={`flex w-full items-center gap-3 py-3 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800 [&_span:nth-child(2)]:grid [&_span:nth-child(2)]:gap-1 [&_small]:text-[10px] [&_small]:text-slate-400 ${isRead ? "opacity-60" : ""} `}
                                    key={item.id}
                                    onClick={goToNotifications}
                                  >
                                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600 ${item.percent >= 100 ? "bg-rose-50 text-rose-600" : ""} `}><Icon name="wallet" size={16} /></span>
                                    <span><strong>{item.category} {item.percent >= 100 ? "budget reached" : "budget nearly reached"}</strong><small>{currency(item.spent, profile.currency)} of {currency(item.limit, profile.currency)} · {item.percent}% used</small></span>
                                    {!isRead && <i className="ml-auto size-2 rounded-full bg-violet-500 " />}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="grid justify-items-center gap-2 py-6 text-center text-xs [&_p]:max-w-56 [&_p]:text-slate-400 "><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 "><Icon name="leaf" size={18} /></span><strong>No budget alerts</strong><p>We’ll let you know when a category reaches 80% of its budget.</p></div>
                          )}
                          <button className="mt-3 w-full border-t border-slate-100 pt-3 text-left text-xs font-semibold text-violet-700 dark:border-slate-700 dark:text-violet-300 " onClick={() => { navigateToPage("Budgets"); setNotificationsOpen(false); }}>Review budgets <span>→</span></button>
                        </motion.section>
                      )}
                    </AnimatePresence>
                  </div>
                  <button className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-violet-100 text-sm font-bold text-violet-700 [&_img]:size-full [&_img]:object-cover size-9 " aria-label="Open profile" onClick={() => navigateToPage("Profile")}>{profile.avatar ? <Image src={profile.avatar} alt="" width={36} height={36} unoptimized /> : initials(profile.name)}</button>
                </div>
              </header>

              {apiError && <div className="mx-6 mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 " role="alert">{apiError}</div>}

              {children ?? (activePage === "Profile" ? (
                <section className="mx-auto w-full max-w-[1190px] px-4 py-6 sm:px-6 lg:px-11 lg:py-9 max-[800px]:py-7 max-[620px]:px-[15px] max-[620px]:py-[23px] max-w-[1190px] ">
                  <div className="mb-7 flex items-end justify-between gap-5 [&_h1]:text-[30px] [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-slate-800 dark:[&_h1]:text-slate-100 max-[620px]:items-start max-[620px]:mb-5 max-[620px]:[&_h1]:text-[26px] "><div><p className="mb-2 text-[10px] font-bold tracking-[1.2px] text-violet-600 dark:text-violet-300 ">YOUR ACCOUNT</p><h1>Profile & settings</h1><p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-[620px]:max-w-[265px] max-[620px]:text-[11px] ">A little about you, and how you like to manage your money.</p></div></div>
                  <div className="mb-4 p-6 max-[620px]:p-4 rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] ">
                    <div className="mb-6 flex items-center gap-4 [&_h2]:font-semibold [&_p]:mt-1 [&_p]:text-xs [&_p]:text-slate-400 "><div className="grid size-16 place-items-center overflow-hidden rounded-full bg-violet-100 text-xl font-bold text-violet-700 [&_img]:size-full [&_img]:object-cover ">{profile.avatar ? <Image src={profile.avatar} alt={`${profile.name}'s profile picture`} width={63} height={63} unoptimized /> : initials(profile.name)}</div><div><h2>{profile.name}</h2><p>{profile.email}</p><span className="mt-2 inline-flex rounded-full bg-violet-50 px-2 py-1 text-[10px] font-medium text-violet-700 ">Personal account</span></div></div>
                    <form className="grid grid-cols-2 gap-5 [&_label]:grid [&_label]:gap-2 [&_label]:text-[10px] [&_label]:font-bold [&_label]:tracking-wide [&_label]:text-slate-500 [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-200 [&_input]:bg-white [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-sm [&_select]:rounded-lg [&_select]:border [&_select]:border-slate-200 [&_select]:bg-white [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-sm dark:[&_input]:border-slate-700 dark:[&_input]:bg-slate-900 dark:[&_select]:border-slate-700 dark:[&_select]:bg-slate-900 max-[620px]:grid-cols-1 " onSubmit={saveProfile}>
                      <label>FULL NAME<input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} required /></label>
                      <label>EMAIL ADDRESS<input type="email" value={profile.email} readOnly /></label>
                      <label>PREFERRED CURRENCY<select value={profile.currency} onChange={(event) => setProfile({ ...profile, currency: event.target.value })}>{currencyOptions.map(([code, name]) => <option key={code} value={code}>{code} — {name}</option>)}</select></label>
                      <label>MONTHLY INCOME GOAL<input type="number" min="0" step="50" value={profile.monthlyIncome} onChange={(event) => setProfile({ ...profile, monthlyIncome: Number(event.target.value) })} /></label>
                      <div className="col-span-2 flex items-center justify-between gap-4 max-[620px]:col-span-1 max-[620px]:items-start max-[620px]:flex-col [&>span]:text-xs [&>span]:text-slate-400 "><span>Your profile is stored in your account.</span><button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 max-[620px]:min-h-9 max-[620px]:gap-1 max-[620px]:px-2.5 max-[620px]:text-[10px] " type="submit">Save changes</button></div>
                    </form>
                  </div>
                  <div className="mb-4 flex items-center justify-between gap-4 p-5 [&_strong]:text-sm [&_p]:mt-1 [&_p]:text-xs [&_p]:text-slate-400 max-[620px]:items-start max-[620px]:flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] ">
                    <div>
                      <strong>Appearance</strong>
                      <p>Choose the look that feels right for you.</p>
                    </div>
                    <button
                      className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 "
                      type="button"
                      role="switch"
                      aria-checked={theme === "dark"}
                      aria-label="Dark mode"
                      onClick={toggleTheme}
                    >
                      <span className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${theme === "dark" ? "bg-violet-600" : "bg-slate-300"}`}>
                        <span className={`size-5 rounded-full bg-white transition-transform ${theme === "dark" ? "translate-x-5" : ""}`} />
                      </span>
                      <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-violet-50 p-4 dark:bg-violet-950/30 max-[620px]:flex-wrap max-[620px]:items-start "><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 "><Icon name="leaf" size={19} /></span><span><strong>Your privacy matters.</strong><small>Your profile and finance data are stored in your Bloom account.</small></span><button className="ml-auto text-xs font-semibold text-rose-600 " onClick={logout}>Sign out</button></div>
                </section>
              ) : activePage === "Budgets" ? (
                <section className="mx-auto w-full max-w-[1190px] px-4 py-6 sm:px-6 lg:px-11 lg:py-9 max-[800px]:py-7 max-[620px]:px-[15px] max-[620px]:py-[23px] ">
                  <div className="mb-7 flex items-end justify-between gap-5 [&_h1]:text-[30px] [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-slate-800 dark:[&_h1]:text-slate-100 max-[620px]:items-start max-[620px]:mb-5 max-[620px]:[&_h1]:text-[26px] "><div><p className="mb-2 text-[10px] font-bold tracking-[1.2px] text-violet-600 dark:text-violet-300 ">MAKE ROOM FOR WHAT MATTERS</p><h1>Your monthly budgets</h1><p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-[620px]:max-w-[265px] max-[620px]:text-[11px] ">Thoughtful limits help your spending match your priorities.</p></div><button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 max-[620px]:min-h-9 max-[620px]:gap-1 max-[620px]:px-2.5 max-[620px]:text-[10px] " onClick={() => openBudgetModal()}><Icon name="plus" size={17} /> Add a budget</button></div>
                  <div className="mb-4 flex items-center gap-8 p-5 [&>div]:grid [&>div]:gap-2 [&>div>strong]:text-2xl [&>div>strong]:font-bold max-[620px]:flex-wrap max-[620px]:gap-4 max-[620px]:p-4 max-[620px]:[&>div>strong]:text-xl rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] "><div><span className="text-[10px] font-bold tracking-[.8px] text-slate-400 ">TOTAL SPENT</span><strong>{currency(expenses, profile.currency)}</strong></div><div className="h-10 w-px bg-slate-200 max-[620px]:hidden " /><div><span className="text-[10px] font-bold tracking-[.8px] text-slate-400 ">TOTAL BUDGETED</span><strong>{currency(budgets.reduce((sum, item) => sum + item.limit, 0), profile.currency)}</strong></div><div className="ml-auto flex items-center gap-2 text-xs text-emerald-600 max-[620px]:ml-0 "><span className="size-2 rounded-full bg-emerald-500 " /> Looking good</div></div>
                  <div className="grid grid-cols-2 gap-4 max-[620px]:grid-cols-1 max-[620px]:gap-2.5 ">{spendingByCategory.map((budget) => {
                    const percentage = Math.min((budget.spent / budget.limit) * 100, 100);
                    return <article className="p-5 max-[620px]:p-4 rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] [&_h3]:mb-2 [&_h3]:font-semibold " key={budget.category}><div className="mb-4 flex items-center justify-between "><span className="grid size-[33px] shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600 max-[620px]:size-[30px] " style={{ backgroundColor: `${budget.color}1c`, color: budget.color }}><Icon name={categoryIcon(budget.category)} size={18} /></span><button className="relative inline-grid size-[34px] shrink-0 place-items-center rounded-lg bg-transparent text-slate-500 transition hover:bg-violet-50 hover:text-violet-700 active:scale-95 dark:text-slate-300 dark:hover:bg-violet-950/50 " aria-label={`Edit ${budget.category} budget`} onClick={() => openBudgetModal(budget.category)}><Icon name="dots" size={18} /></button></div><h3>{budget.category}</h3><div className="mb-3 flex items-baseline gap-2 [&_strong]:text-xl [&_strong]:font-bold [&_span]:text-xs [&_span]:text-slate-400 "><strong>{currency(budget.spent, profile.currency)}</strong><span>of {currency(budget.limit, profile.currency)}</span></div><div className="h-[5px] overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700 [&_span]:block [&_span]:h-full [&_span]:rounded-full "><span style={{ width: `${percentage}%`, backgroundColor: budget.color }} /></div><div className="mt-2 flex justify-between text-[11px] text-slate-400 "><span>{Math.round(percentage)}% used</span><span>{currency(Math.max(budget.limit - budget.spent, 0), profile.currency)} left</span></div></article>;
                  })}</div>
                </section>
              ) : activePage === "Transactions" ? (
                <section className="mx-auto w-full max-w-[1190px] px-4 py-6 sm:px-6 lg:px-11 lg:py-9 max-[800px]:py-7 max-[620px]:px-[15px] max-[620px]:py-[23px] ">
                  <div className="mb-7 flex items-end justify-between gap-5 [&_h1]:text-[30px] [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-slate-800 dark:[&_h1]:text-slate-100 max-[620px]:items-start max-[620px]:mb-5 max-[620px]:[&_h1]:text-[26px] "><div><p className="mb-2 text-[10px] font-bold tracking-[1.2px] text-violet-600 dark:text-violet-300 ">YOUR MONEY, IN MOTION</p><h1>Transactions</h1><p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-[620px]:max-w-[265px] max-[620px]:text-[11px] ">Every little detail, all in one place.</p></div><button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 max-[620px]:min-h-9 max-[620px]:gap-1 max-[620px]:px-2.5 max-[620px]:text-[10px] " onClick={() => openAddModal()}><Icon name="plus" size={18} /> Add transaction</button></div>
                  <section className="rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] p-5 max-[620px]:px-2.5 max-[620px]:py-3 ">
                    <div className="mb-4 flex items-center gap-3 max-[620px]:flex-wrap "><div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-400 [&_input]:w-full [&_input]:border-0 [&_input]:bg-transparent [&_input]:text-sm [&_input]:outline-none dark:border-slate-700 dark:bg-slate-900 max-[620px]:basis-full "><Icon name="search" size={18} /><input placeholder="Search transactions..." value={search} onChange={(event) => setSearch(event.target.value)} /></div><select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 " value={filterType} onChange={(event) => setFilterType(event.target.value)}><option>All</option><option>Income</option><option>Expense</option></select><button className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 " onClick={exportTransactions}><Icon name="download" size={17} /> Export</button></div>
                    {renderTransactionsTable(filteredTransactions)}
                  </section>
                </section>
              ) : activePage === "Analytics" ? (
                <section className="mx-auto w-full max-w-[1190px] px-4 py-6 sm:px-6 lg:px-11 lg:py-9 max-[800px]:py-7 max-[620px]:px-[15px] max-[620px]:py-[23px] ">
                  <div className="mb-7 flex items-end justify-between gap-5 [&_h1]:text-[30px] [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-slate-800 dark:[&_h1]:text-slate-100 max-[620px]:items-start max-[620px]:mb-5 max-[620px]:[&_h1]:text-[26px] "><div><p className="mb-2 text-[10px] font-bold tracking-[1.2px] text-violet-600 dark:text-violet-300 ">THE BIGGER PICTURE</p><h1>Your money story</h1><p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-[620px]:max-w-[265px] max-[620px]:text-[11px] ">Small insights can make a big difference.</p></div><button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 " onClick={() => setPeriod(period === "This month" ? "Last 6 months" : "This month")}>{period}<Icon name="down" size={16} /></button></div>
                  <div className="mb-4 grid grid-cols-3 gap-4 max-[620px]:gap-2 "><article className="flex flex-col gap-3 p-5 [&>strong]:text-xl [&>strong]:font-bold max-[620px]:gap-2 max-[620px]:px-3 max-[620px]:py-3 max-[620px]:[&>strong]:text-lg rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] "><span className="text-[10px] font-bold tracking-[.8px] text-slate-400 ">TOTAL INCOME</span><strong>{currency(analyticsIncome, profile.currency)}</strong><small className="text-[11px] text-slate-400 max-[620px]:text-[9px] ">{period}</small></article><article className="flex flex-col gap-3 p-5 [&>strong]:text-xl [&>strong]:font-bold max-[620px]:gap-2 max-[620px]:px-3 max-[620px]:py-3 max-[620px]:[&>strong]:text-lg rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] "><span className="text-[10px] font-bold tracking-[.8px] text-slate-400 ">TOTAL SPENDING</span><strong>{currency(analyticsExpenses, profile.currency)}</strong><small className="text-[11px] text-slate-400 max-[620px]:text-[9px] ">{period}</small></article><article className="flex flex-col gap-3 p-5 [&>strong]:text-xl [&>strong]:font-bold max-[620px]:gap-2 max-[620px]:px-3 max-[620px]:py-3 max-[620px]:[&>strong]:text-lg rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] "><span className="text-[10px] font-bold tracking-[.8px] text-slate-400 ">SAVINGS RATE</span><strong>{analyticsIncome ? `${Math.round(((analyticsIncome - analyticsExpenses) / analyticsIncome) * 100)}%` : "0%"}</strong><small className="text-[11px] text-slate-400 max-[620px]:text-[9px] ">Of your income · {period.toLowerCase()}</small></article></div>
                  <section className="rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] mb-4 p-5 max-[620px]:p-4 "><div className="mb-5 flex items-center justify-between gap-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-800 [&_p]:mt-1 [&_p]:text-xs [&_p]:text-slate-400 dark:[&_h2]:text-slate-100 "><div><h2>Income vs. spending</h2><p>{period === "This month" ? "This month’s money in and money out." : "A little progress, month by month."}</p></div><div className="flex items-center gap-4 text-[11px] text-slate-500 [&_span]:inline-flex [&_span]:items-center [&_span]:gap-1.5 "><span><i className="inline-block size-2 rounded-full bg-violet-500 " /> Income</span><span><i className="inline-block size-2 rounded-full bg-rose-400 " /> Spending</span></div></div><div className="flex min-h-[160px] flex-1 items-end justify-around gap-2 border-b border-l border-slate-100 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(25%-1px),#f1f1f6_calc(25%-1px),#f1f1f6_25%)] px-2 dark:border-slate-700 h-[260px] gap-3 max-[620px]:h-[200px] ">{analyticsData.map((item) => <div className="flex w-[13%] flex-col items-center justify-end " key={item.month}><div className="flex h-[calc(100%-25px)] w-full items-end justify-center gap-1.5 "><span className="block min-h-[3px] w-[27%] max-w-[22px] rounded-t-md bg-violet-500 " style={{ height: `${(item.income / maxChart) * 100}%` }} /><span className="block min-h-[3px] w-[27%] max-w-[22px] rounded-t-md bg-rose-400 " style={{ height: `${(item.expense / maxChart) * 100}%` }} /></div><span className="mt-2 text-[10px] text-slate-400 ">{item.month}</span></div>)}</div></section>
                  <section className="rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] p-5 max-[620px]:p-4 "><div className="mb-5 flex items-center justify-between gap-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-800 [&_p]:mt-1 [&_p]:text-xs [&_p]:text-slate-400 dark:[&_h2]:text-slate-100 "><div><h2>Where it goes</h2><p>Your spending by category this month.</p></div></div>{spendingByCategory.map((item) => <div className="grid grid-cols-[130px_1fr_80px] items-center gap-3 " key={item.category}><span className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 "><i style={{ backgroundColor: item.color }} />{item.category}</span><div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700 "><span style={{ width: `${expenses ? (item.spent / expenses) * 100 : 0}%`, backgroundColor: item.color }} /></div><strong>{currency(item.spent, profile.currency)}</strong></div>)}</section>
                </section>
              ) : (
                <section className="mx-auto w-full max-w-[1190px] px-4 py-6 sm:px-6 lg:px-11 lg:py-9 max-[800px]:py-7 max-[620px]:px-[15px] max-[620px]:py-[23px] max-w-[1190px] ">
                  <div className="mb-7 flex items-end justify-between gap-5 [&_h1]:text-[30px] [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-slate-800 dark:[&_h1]:text-slate-100 max-[620px]:items-start max-[620px]:mb-5 max-[620px]:[&_h1]:text-[26px] "><div><p className="mb-2 text-[10px] font-bold tracking-[1.2px] text-violet-600 dark:text-violet-300 ">{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}</p><h1>Good morning, {profile.name.trim().split(/\s+/)[0]} <span className="ml-1 inline-block text-2xl align-middle text-amber-400 ">✳</span></h1><p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-[620px]:max-w-[265px] max-[620px]:text-[11px] ">Here’s your money at a glance. You’re doing great.</p></div><button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 max-[620px]:min-h-9 max-[620px]:gap-1 max-[620px]:px-2.5 max-[620px]:text-[10px] " onClick={() => openAddModal()}><Icon name="plus" size={18} /> Add transaction</button></div>

                  <section className="grid grid-cols-[1.28fr_1fr_1fr] gap-4 max-[1100px]:gap-2.5 max-[800px]:grid-cols-2 max-[620px]:grid-cols-1 ">
                    <article className={`relative min-h-[204px] overflow-hidden rounded-xl border-0 bg-gradient-to-br from-violet-600 to-violet-400 p-5 text-white shadow-sm rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25]${balanceMenuOpen ? " z-10 overflow-visible [&_.balance-decoration]:invisible [&_.card-overline]:z-[7]" : ""} `}>
                      <div className="relative z-[1] flex items-center justify-between text-[10px] font-semibold tracking-widest text-white/75 "><span>YOUR BALANCE</span><div className="relative " ref={balanceMenuRef}>
                        <button className="relative z-[6] grid size-7 place-items-center rounded-lg bg-white/15 text-white transition hover:scale-105 hover:bg-white/25 " aria-label="Balance options" aria-expanded={balanceMenuOpen} onClick={() => { setBalanceMenuOpen((open) => !open); setNotificationsOpen(false); }}><Icon name="dots" size={18} /></button>
                        {balanceMenuOpen && <div className="absolute right-0 top-[calc(100%+7px)] z-50 w-[155px] origin-top-right overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-[#191b25] [&_button]:block [&_button]:w-full [&_button]:rounded-md [&_button]:px-2.5 [&_button]:py-2 [&_button]:text-left [&_button]:text-[11px] [&_button]:text-slate-600 [&_button:hover]:bg-violet-50 dark:[&_button]:text-slate-200 dark:[&_button:hover]:bg-violet-950/50 " role="menu"><button role="menuitem" onClick={() => { setBalanceMenuOpen(false); openAddModal("income"); }}>Add income</button><button role="menuitem" onClick={() => { setBalanceMenuOpen(false); openAddModal("expense"); }}>Add expense</button><button role="menuitem" onClick={() => { setBalanceMenuOpen(false); navigateToPage("Analytics"); }}>View analytics</button><button role="menuitem" onClick={() => setShowBalance((visible) => !visible)}>{showBalance ? "Hide balance" : "Show balance"}</button></div>}
                      </div></div>
                      <div className="relative mt-5 text-3xl font-bold tracking-tight ">{showBalance ? currency(balance, profile.currency) : "••••••"}</div>
                      <div className="relative mt-1 text-xs text-white/80 "><span className="inline-flex items-center gap-1 "><Icon name={previousBalance > 0 && balance < previousBalance ? "down" : "up"} size={15} /> {trend(balance, previousBalance)}</span></div>
                      <div className="my-4 h-px bg-white/20 " />
                      <div className="flex justify-between gap-4 text-xs text-white/80 max-[1100px]:gap-2 "><span><i className="mr-1 inline-block size-2 rounded-full bg-emerald-200 " /> Income <strong>{currency(income, profile.currency, true)}</strong></span><span><i className="mr-1 inline-block size-2 rounded-full bg-rose-200 " /> Expenses <strong>{currency(expenses, profile.currency, true)}</strong></span></div>
                      <div className="pointer-events-none absolute rounded-full border border-white/10 -right-11 -top-16 size-48 " /><div className="pointer-events-none absolute rounded-full border border-white/10 -right-1 -top-7 size-28 " />
                    </article>
                    <article className="relative min-h-[204px] overflow-hidden rounded-xl border border-slate-200 bg-white p-[18px] shadow-sm dark:border-slate-700 dark:bg-[#191b25] rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] border-emerald-100 dark:border-slate-700 [&_.summary-icon]:bg-emerald-50 [&_.summary-icon]:text-emerald-600 "><div className="mb-4 flex items-center justify-between "><span className="grid size-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300 "><Icon name="down" size={18} /></span><span className={`inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 ${incomeChange !== null && incomeChange < 0 ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300" : ""} `}>{incomeChange === null ? "No previous data" : <><Icon name={incomeChange >= 0 ? "up" : "down"} size={14} /> {Math.abs(incomeChange)}%</>}</span></div><span className="text-[10px] font-bold tracking-[.8px] text-slate-400 ">TOTAL INCOME</span><strong className="mt-2 block text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 ">{currency(income, profile.currency)}</strong><span className="mt-1 block text-[10px] text-slate-400 ">{trend(income, previousIncome)}</span><div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 opacity-80 [&_svg]:size-full [&_svg]:overflow-visible [&_path]:fill-none [&_path]:stroke-[2.5] [&_path]:[vector-effect:non-scaling-stroke] [&_path]:stroke-emerald-400 "><svg viewBox="0 0 220 50" preserveAspectRatio="none" aria-hidden="true"><path d="M0 39 C20 36 27 19 44 26 S70 40 86 23 S112 30 130 13 S154 30 171 14 S201 20 220 4" /></svg></div></article>
                    <article className="relative min-h-[204px] overflow-hidden rounded-xl border border-slate-200 bg-white p-[18px] shadow-sm dark:border-slate-700 dark:bg-[#191b25] rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] border-rose-100 dark:border-slate-700 [&_.summary-icon]:bg-rose-50 [&_.summary-icon]:text-rose-600 "><div className="mb-4 flex items-center justify-between "><span className="grid size-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300 "><Icon name="up" size={18} /></span><span className={`inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 ${expensesChange !== null && expensesChange > 0 ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300" : "text-slate-400"} `}>{expensesChange === null ? "No previous data" : <><Icon name={expensesChange <= 0 ? "down" : "up"} size={14} /> {Math.abs(expensesChange)}%</>}</span></div><span className="text-[10px] font-bold tracking-[.8px] text-slate-400 ">TOTAL EXPENSES</span><strong className="mt-2 block text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 ">{currency(expenses, profile.currency)}</strong><span className="mt-1 block text-[10px] text-slate-400 ">{trend(expenses, previousExpenses)}</span><div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 opacity-80 [&_svg]:size-full [&_svg]:overflow-visible [&_path]:fill-none [&_path]:stroke-[2.5] [&_path]:[vector-effect:non-scaling-stroke] [&_path]:stroke-rose-300 "><svg viewBox="0 0 220 50" preserveAspectRatio="none" aria-hidden="true"><path d="M0 12 C18 20 25 6 44 21 S69 38 86 23 S111 32 131 15 S151 30 173 25 S201 15 220 31" /></svg></div></article>
                  </section>

                  <section className="mt-4 grid grid-cols-[1.55fr_1fr] gap-4 max-[1100px]:grid-cols-[1.35fr_1fr] max-[1100px]:gap-2.5 max-[800px]:grid-cols-1 ">
                    <article className="rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] p-5 max-[1100px]:px-3.5 max-[620px]:p-4 "><div className="mb-5 flex items-center justify-between gap-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-800 [&_p]:mt-1 [&_p]:text-xs [&_p]:text-slate-400 dark:[&_h2]:text-slate-100 "><div><h2>Spending overview</h2><p>Income and expenses over time</p></div><button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 " onClick={() => setPeriod(period === "This month" ? "Last 6 months" : "This month")}>{period}<Icon name="down" size={16} /></button></div><div className="flex items-center gap-4 text-[11px] text-slate-500 [&_span]:inline-flex [&_span]:items-center [&_span]:gap-1.5 "><span><i className="inline-block size-2 rounded-full bg-violet-500 " /> Income</span><span><i className="inline-block size-2 rounded-full bg-rose-400 " /> Expenses</span></div><div className="flex h-[230px] gap-3 "><div className="flex flex-col justify-between pb-6 text-[10px] text-slate-400 "><span>{currency(maxChart, profile.currency, true)}</span><span>{currency(maxChart * 0.75, profile.currency, true)}</span><span>{currency(maxChart * 0.5, profile.currency, true)}</span><span>{currency(maxChart * 0.25, profile.currency, true)}</span><span>$0</span></div><div className="flex min-h-[160px] flex-1 items-end justify-around gap-2 border-b border-l border-slate-100 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(25%-1px),#f1f1f6_calc(25%-1px),#f1f1f6_25%)] px-2 dark:border-slate-700 ">{visibleChartData.map((item) => <div className="flex w-[13%] flex-col items-center justify-end " key={item.month}><div className="flex h-[calc(100%-25px)] w-full items-end justify-center gap-1.5 "><span className="block min-h-[3px] w-[27%] max-w-[22px] rounded-t-md bg-violet-500 " style={{ height: `${(item.income / maxChart) * 100}%` }} /><span className="block min-h-[3px] w-[27%] max-w-[22px] rounded-t-md bg-rose-400 " style={{ height: `${(item.expense / maxChart) * 100}%` }} /></div><span className="mt-2 text-[10px] text-slate-400 ">{item.month}</span></div>)}</div></div></article>
                    <article className="rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] p-5 max-[1100px]:px-3.5 "><div className="mb-5 flex items-center justify-between gap-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-800 [&_p]:mt-1 [&_p]:text-xs [&_p]:text-slate-400 dark:[&_h2]:text-slate-100 "><div><h2>Monthly budgets</h2><p>A little plan goes a long way.</p></div><button className="text-xs font-semibold text-violet-700 hover:text-violet-900 dark:text-violet-300 " onClick={() => navigateToPage("Budgets")}>See all <span>→</span></button></div><div className="mt-5 grid gap-4 ">{spendingByCategory.slice(0, 4).map((item) => { const percent = Math.min((item.spent / item.limit) * 100, 100); return <div className="grid gap-2" key={item.category}><div className="mb-1 flex items-center justify-between "><span className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 [&_i]:size-2 [&_i]:rounded-full "><i style={{ backgroundColor: item.color }} />{item.category}</span><span className="text-[11px] text-slate-400 [&_strong]:text-slate-700 dark:[&_strong]:text-slate-200 "><strong>{currency(item.spent, profile.currency, true)}</strong> / {currency(item.limit, profile.currency, true)}</span></div><div className="h-[5px] overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700 [&_span]:block [&_span]:h-full [&_span]:rounded-full "><span style={{ width: `${percent}%`, backgroundColor: item.color }} /></div></div>; })}</div><button className="mt-5 text-left text-xs font-semibold text-violet-700 dark:text-violet-300 " onClick={() => navigateToPage("Budgets")}>Manage your budgets <span>→</span></button></article>
                  </section>

                  <section className="rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-[#2d303c] dark:bg-[#191b25] mt-4 p-5 max-[620px]:p-4 "><div className="mb-5 flex items-center justify-between gap-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-800 [&_p]:mt-1 [&_p]:text-xs [&_p]:text-slate-400 dark:[&_h2]:text-slate-100 "><div><h2>Recent transactions</h2><p>Your latest money moves.</p></div><button className="text-xs font-semibold text-violet-700 hover:text-violet-900 dark:text-violet-300 " onClick={() => navigateToPage("Transactions")}>View all <span>→</span></button></div>{renderTransactionsTable(recentTransactions)}</section>
                  <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400 "><span>Made for your money journey</span><span className="text-violet-500 ">✳</span><span>One mindful choice at a time.</span></div>
                </section>
              ))}
            </main>

            <AnimatePresence>
              {isModalOpen && <motion.div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4 " initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setIsModalOpen(false); }}><motion.section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-[#191b25] [&_label]:grid [&_label]:gap-2 [&_label]:text-xs [&_label]:font-semibold [&_label]:text-slate-600 [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-200 [&_input]:bg-white [&_input]:px-3 [&_input]:py-2 [&_select]:rounded-lg [&_select]:border [&_select]:border-slate-200 [&_select]:bg-white [&_select]:px-3 [&_select]:py-2 dark:[&_input]:border-slate-700 dark:[&_input]:bg-slate-900 dark:[&_select]:border-slate-700 dark:[&_select]:bg-slate-900 " role="dialog" aria-modal="true" aria-labelledby="modal-title" initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ duration: 0.2, ease: [0.2, 0.75, 0.25, 1] }}><div className="mb-5 flex items-center justify-between [&_h2]:text-lg [&_h2]:font-semibold "><div><p className="mb-2 text-[10px] font-bold tracking-[1.2px] text-violet-600 dark:text-violet-300 ">KEEP IT UP</p><h2 id="modal-title">{editingId ? "Edit transaction" : "Add a transaction"}</h2></div><button className="relative inline-grid size-[34px] shrink-0 place-items-center rounded-lg bg-transparent text-slate-500 transition hover:bg-violet-50 hover:text-violet-700 active:scale-95 dark:text-slate-300 dark:hover:bg-violet-950/50 " onClick={() => setIsModalOpen(false)} aria-label="Close dialog"><Icon name="close" size={20} /></button></div><form onSubmit={saveTransaction}><div className="flex rounded-lg bg-slate-100 p-1 [&_button]:flex-1 [&_button]:rounded-md [&_button]:py-2 [&_button]:text-xs [&_button]:font-semibold [&_button]:text-slate-500 [&_button.active]:bg-white [&_button.active]:text-violet-700 [&_button.active]:shadow-sm"><button type="button" className={draft.type === "expense" ? "active" : ""} onClick={() => setDraft({ ...draft, type: "expense" })}>Expense</button><button type="button" className={draft.type === "income" ? "active" : ""} onClick={() => setDraft({ ...draft, type: "income" })}>Income</button></div><label>NAME<input autoFocus placeholder="e.g. Weekly groceries" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /></label><div className="grid grid-cols-2 gap-4 max-[620px]:grid-cols-1 "><label>AMOUNT ({profile.currency})<input type="number" min="0.01" step="0.01" placeholder="0.00" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} required /></label><label>CATEGORY<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label></div><label>DATE<input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} required /></label><label>NOTE <span className="text-[11px] text-slate-400 ">OPTIONAL</span><input placeholder="Add a note or merchant" value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} /></label><button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 max-[620px]:min-h-9 max-[620px]:gap-1 max-[620px]:px-2.5 max-[620px]:text-[10px] w-full justify-center " type="submit">{editingId ? "Save changes" : "Add transaction"}</button></form></motion.section></motion.div>}
            </AnimatePresence>
            <AnimatePresence>
              {isBudgetModalOpen && <motion.div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-4 " initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setIsBudgetModalOpen(false); }}><motion.section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-[#191b25] [&_label]:grid [&_label]:gap-2 [&_label]:text-xs [&_label]:font-semibold [&_label]:text-slate-600 [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-200 [&_input]:bg-white [&_input]:px-3 [&_input]:py-2 [&_select]:rounded-lg [&_select]:border [&_select]:border-slate-200 [&_select]:bg-white [&_select]:px-3 [&_select]:py-2 dark:[&_input]:border-slate-700 dark:[&_input]:bg-slate-900 dark:[&_select]:border-slate-700 dark:[&_select]:bg-slate-900 " role="dialog" aria-modal="true" aria-labelledby="budget-modal-title" onKeyDown={(event) => { if (event.key === "Escape") setIsBudgetModalOpen(false); }} initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ duration: 0.2, ease: [0.2, 0.75, 0.25, 1] }}><div className="mb-5 flex items-center justify-between [&_h2]:text-lg [&_h2]:font-semibold "><div><p className="mb-2 text-[10px] font-bold tracking-[1.2px] text-violet-600 dark:text-violet-300 ">PLAN WITH PURPOSE</p><h2 id="budget-modal-title">{budgets.some((item) => item.category === budgetDraft.category) ? "Edit monthly budget" : "Add a monthly budget"}</h2></div><button className="relative inline-grid size-[34px] shrink-0 place-items-center rounded-lg bg-transparent text-slate-500 transition hover:bg-violet-50 hover:text-violet-700 active:scale-95 dark:text-slate-300 dark:hover:bg-violet-950/50 " type="button" onClick={() => setIsBudgetModalOpen(false)} aria-label="Close dialog"><Icon name="close" size={20} /></button></div><form onSubmit={saveBudget}><label>CATEGORY<select autoFocus value={budgetDraft.category} onChange={(event) => { const category = event.target.value; const existing = budgets.find((item) => item.category === category); setBudgetDraft({ category, limit: String(existing?.limit ?? 250) }); }} required>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label><label>MONTHLY LIMIT ({profile.currency})<input type="number" min="0.01" step="0.01" placeholder="250.00" value={budgetDraft.limit} onChange={(event) => setBudgetDraft({ ...budgetDraft, limit: event.target.value })} required /></label>{apiError && <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 " role="alert">{apiError}</div>}<button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 max-[620px]:min-h-9 max-[620px]:gap-1 max-[620px]:px-2.5 max-[620px]:text-[10px] w-full justify-center " type="submit" disabled={budgetSaving}>{budgetSaving ? "Saving..." : budgets.some((item) => item.category === budgetDraft.category) ? "Save changes" : "Add budget"}</button></form></motion.section></motion.div>}
            </AnimatePresence>
          </div>
        </DashboardContext.Provider>
      </>
    </MotionConfig>
  );
}
