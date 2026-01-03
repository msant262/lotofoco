'use client';

import "@/lib/suppress-nivo-errors";
import { HeroUIProvider as Provider } from "@heroui/react";

export function HeroUIProvider({ children }: { children: React.ReactNode }) {
    return (
        <Provider>
            {children}
        </Provider>
    );
}
