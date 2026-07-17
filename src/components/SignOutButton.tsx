"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      style={{ fontSize: 14, background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
    >
      Sign out
    </button>
  );
}