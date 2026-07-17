"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { StreakHeatmap } from "@/components/StreakHeatMap";

interface HabitDetail {
  id: string;
  title: string;
  frequency: "DAILY" | "WEEKLY";
  color: string;
  icon: string;
  currentStreak: number;
  longestStreak: number;
  logs: { date: string }[];
}

const COLOR_MAP: Record<string, string> = {
  teal: "#0F6E56",
  coral: "#C25B3D",
  purple: "#6C5CE7",
};

export default function HabitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [habit, setHabit] = useState<HabitDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/habits/${id}`);
    if (res.status === 404) {
      setError("Habit not found");
      return;
    }
    if (!res.ok) {
      setError("Couldn't load this habit");
      return;
    }
    setHabit(await res.json());
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    if (!confirm("Delete this habit? This can't be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/habits/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setDeleting(false);
      setError("Couldn't delete this habit");
    }
  }

  if (error) {
    return (
      <div style={{ maxWidth: 680, margin: "3rem auto", padding: "0 1rem", color: "var(--text-secondary)" }}>
        {error} — <a href="/dashboard">back to dashboard</a>
      </div>
    );
  }

  if (!habit) {
    return (
      <div style={{ maxWidth: 680, margin: "3rem auto", padding: "0 1rem", color: "var(--text-secondary)" }}>
        Loading…
      </div>
    );
  }

  const accentColor = COLOR_MAP[habit.color] ?? COLOR_MAP.teal;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1rem" }}>
      <a href="/dashboard" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        ← Dashboard
      </a>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "0.75rem 0 1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>{habit.title}</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0" }}>
            {habit.frequency === "DAILY" ? "Daily habit" : "Weekly habit"}
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ fontSize: 13, color: "#C25B3D", background: "none", border: "1px solid var(--border)" }}
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: "2rem" }}>
        <div style={{ background: "var(--surface-1)", borderRadius: 12, padding: "1rem" }}>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 4px" }}>Current streak</p>
          <p style={{ fontSize: 24, fontWeight: 500, margin: 0 }}>{habit.currentStreak} days</p>
        </div>
        <div style={{ background: "var(--surface-1)", borderRadius: 12, padding: "1rem" }}>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 4px" }}>Longest streak</p>
          <p style={{ fontSize: 24, fontWeight: 500, margin: 0 }}>{habit.longestStreak} days</p>
        </div>
      </div>

      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>
        Last 26 weeks
      </p>
      <StreakHeatmap
        logDates={habit.logs.map((l) => new Date(l.date))}
        weeksToShow={26}
        accentColor={accentColor}
      />
    </div>
  );
}