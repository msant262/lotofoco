'use client';

import { Sidebar } from "./sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-950 pt-16">
            <div className="flex w-full">
                <Sidebar />
                <main className="flex-1 p-6 md:p-8 w-full overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
