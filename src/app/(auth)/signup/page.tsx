"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong");
      setSubmitting(false);
      return;
    }

    // account created — sign in immediately rather than sending them back
    // to the login page to re-enter what they just typed
    const result = await signIn("credentials", { email, password, redirect: false });
    setSubmitting(false);

    if (result?.error) {
      // account exists but auto-login failed for some reason — send them
      // to log in manually rather than leaving them stuck
      router.push("/login");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div style={{ maxWidth: 360, margin: "4rem auto", padding: "0 1rem" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: "1.5rem" }}>Create your account</h1>

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

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {error && (
          <p style={{ color: "#C25B3D", fontSize: 13, margin: 0 }}>{error}</p>
        )}
        <button type="submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: "1.5rem" }}>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </div>
  );
}