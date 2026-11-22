import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import DashboardApp from "./components/DashboardApp";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bloom — Your money, in balance",
  description:
    "A thoughtful place to track your income, expenses, budgets, and financial goals.",
  icons: {
    icon: "/bloom-mark.svg",
  },
};

export const instant = false;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#f7f8fc] font-sans text-[#24243a] antialiased transition-colors dark:bg-[#11131a] dark:text-[#e7e8f0]">
        <DashboardApp>{children}</DashboardApp>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
