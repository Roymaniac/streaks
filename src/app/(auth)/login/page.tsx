"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div style={{ maxWidth: 360, margin: "4rem auto", padding: "0 1rem" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: "1.5rem" }}>Log in</h1>

      <button
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        style={{ width: "100%", marginBottom: "1rem" }}
      >
        Continue with Google
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "1rem 0", color: "var(--text-secondary)", fontSize: 13 }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        or
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      <form onSubmit={handleCredentialsLogin} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p style={{ color: "#C25B3D", fontSize: 13, margin: 0 }}>{error}</p>
        )}
        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: "1.5rem" }}>
        Don&apos;t have an account? <a href="/signup">Sign up</a>
      </p>
    </div>
  );
}