import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PathSmith — AI Life Decision Simulator",
  description: "An AI-powered cognitive strategy engine to detect biases, clarify life constraints, and model branching future paths. Simulate your life decisions before you make them.",
  keywords: "life decision simulator, AI decision making, cognitive bias detector, career path simulator, future path modeling",
  authors: [{ name: "PathSmith" }],
  openGraph: {
    title: "PathSmith — AI Life Decision Simulator",
    description: "Simulate your life's biggest decisions with AI. Detect biases, clarify constraints, and chart branching future paths.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="cyber-grid min-h-screen text-main antialiased selection:bg-accent/25 selection:text-main">
        <div className="page-enter">
          {children}
        </div>
      </body>
    </html>
  );
}
