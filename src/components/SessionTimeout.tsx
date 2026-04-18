"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

export function SessionTimeout() {
  const { data: session, status } = useSession();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Time in milliseconds (20 minutes)
  const INACTIVITY_LIMIT = 20 * 60 * 1000;

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (status === "authenticated") {
      timeoutRef.current = setTimeout(() => {
        console.log("Sesión cerrada por inactividad");
        signOut({ callbackUrl: "/login" });
      }, INACTIVITY_LIMIT);
    }
  };

  useEffect(() => {
    // Events to track user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      resetTimer();
    };

    if (status === "authenticated") {
      // Start the initial timer
      resetTimer();

      // Add event listeners
      events.forEach((event) => {
        window.addEventListener(event, handleActivity);
      });
    }

    return () => {
      // Cleanup
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [status]);

  return null; // This component doesn't render anything
}
