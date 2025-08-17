import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Website Enhancer",
  description: "Transform any website with AI-powered enhancements. Enter a URL and get a modern, responsive, and accessible version instantly.",
  keywords: ["AI", "website enhancement", "web design", "responsive design", "accessibility"],
  authors: [{ name: "AI Website Enhancer" }],
  openGraph: {
    title: "AI Website Enhancer",
    description: "Transform any website with AI-powered enhancements",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background font-sans antialiased">
            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}