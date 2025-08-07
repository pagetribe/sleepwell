import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google'; // Import the font
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

// Initialize the font
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter', // Optional: if you want to use it as a CSS variable
});

export const metadata: Metadata = {
  title: 'SleepWell',
  description: "Log and analyze your sleep patterns for a better night's rest.",
  manifest: '/manifest.webmanifest', // Corrected path assuming it's in the public folder
};

export const viewport: Viewport = {
  themeColor: '#E6E6FA',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Add the font's className to the <html> tag
    <html lang="en" className={inter.className}>
      {/* The <head> tag is now gone from here */}
      <body className="antialiased bg-background">
        {children}
        <Toaster />
      </body>
    </html>
  );
}