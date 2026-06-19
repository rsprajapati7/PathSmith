import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PathSmith — Life Decision Simulator",
  description: "An AI-powered cognitive strategy engine to detect biases, clarify life constraints, and model branching future paths.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="cyber-grid min-h-screen text-gray-200 antialiased selection:bg-accent/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}

