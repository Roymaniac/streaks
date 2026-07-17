"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COLORS = ["teal", "coral", "purple"] as const;

export default function NewHabitPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY">("DAILY");
  const [color, setColor] = useState<(typeof COLORS)[number]>("teal");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, frequency, color }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 420, margin: "3rem auto", padding: "0 1rem" }}>
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: "1.5rem" }}>New habit</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <label>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Title</span>
          <input
            type="text"
            placeholder="e.g. Morning run"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
            style={{ width: "100%", marginTop: 4 }}
          />
        </label>

        <div>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Frequency</span>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            {(["DAILY", "WEEKLY"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequency(f)}
                style={{
                  flex: 1,
                  background: frequency === f ? "var(--surface-1)" : "transparent",
                  border: "1px solid var(--border)",
                }}
              >
                {f === "DAILY" ? "Daily" : "Weekly"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Color</span>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => setColor(c)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: color === c ? "2px solid var(--text-primary)" : "1px solid var(--border)",
                  background:
                    c === "teal" ? "#0F6E56" : c === "coral" ? "#C25B3D" : "#6C5CE7",
                }}
              />
            ))}
          </div>
        </div>

        {error && <p style={{ color: "#C25B3D", fontSize: 13, margin: 0 }}>{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create habit"}
        </button>
      </form>
    </div>
  );
}