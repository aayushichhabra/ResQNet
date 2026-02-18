import "./globals.css";
import React from "react";
import Sidebar from "../components/Sidebar"; // Adjust path if your components are in a different folder
import Topbar from "../components/Topbar";

export const metadata = {
  title: "ResQNet — Government Dashboard",
  description: "Government dashboard for ResQNet",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <div className="flex min-h-screen">
          {/* Sidebar stays fixed on the left */}
          <Sidebar />

          {/* Main content area */}
          <div className="flex-1 flex flex-col">
            {/* Topbar stays fixed at the top */}
            <Topbar />
            
            {/* The page-specific content renders here */}
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}