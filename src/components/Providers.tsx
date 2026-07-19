"use client";

import { SessionProvider } from "next-auth/react";
import { SessionTimeout } from "./SessionTimeout";
import { UserPlanProvider } from "./UserPlanProvider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <SessionTimeout />
            <UserPlanProvider>
                {children}
            </UserPlanProvider>
        </SessionProvider>
    );
}
