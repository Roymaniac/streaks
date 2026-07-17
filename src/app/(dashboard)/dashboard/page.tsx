"use client";

import { useEffect, useState, useCallback } from "react";
import { HabitCard } from "@/components/HabitCard";

interface Habit {
  id: string;
  title: string;
  frequency: "DAILY" | "WEEKLY";
  color: string;
  icon: string;
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
}

interface PartnerActivityItem {
  partnershipId: string;
  partner: { id: string; name: string | null; email: string };
  topHabit: { title: string; currentStreak: number } | null;
  canNudge: boolean;
}

export default function DashboardPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activity, setActivity] = useState<PartnerActivityItem[]>([]);
  const [nudging, setNudging] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHabits = useCallback(async () => {
    try {
      const res = await fetch("/api/habits");
      if (!res.ok) throw new Error("Failed to load habits");
      setHabits(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadActivity = useCallback(async () => {
    const res = await fetch("/api/partnerships/activity");
    if (res.ok) setActivity(await res.json());
  }, []);

  useEffect(() => {
    loadHabits();
    loadActivity();
  }, [loadHabits, loadActivity]);

  async function handleNudge(partnershipId: string) {
    setNudging(partnershipId);
    const res = await fetch("/api/nudges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnershipId }),
    });
    setNudging(null);
    if (res.ok) {
      setActivity((prev) =>
        prev.map((a) => (a.partnershipId === partnershipId ? { ...a, canNudge: false } : a))
      );
    }
  }

  async function handleToggle(habitId: string) {
    // optimistic update — flip the check state immediately, reconcile
    // with the server's streak numbers when the response comes back,
    // and roll back on failure
    const previous = habits;
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId ? { ...h, completedToday: !h.completedToday } : h
      )
    );

    try {
      const res = await fetch(`/api/habits/${habitId}/logs`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to update");
      const { completed, currentStreak, longestStreak } = await res.json();
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId
            ? { ...h, completedToday: completed, currentStreak, longestStreak }
            : h
        )
      );
    } catch {
      setHabits(previous); // rollback
    }
  }

  const activeCount = habits.length;
  const longestOverall = habits.reduce((max, h) => Math.max(max, h.longestStreak), 0);

  if (loading) {
    return <div style={{ padding: "2rem", color: "var(--text-secondary)" }}>Loading…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", color: "var(--text-secondary)" }}>
        Couldn&apos;t load your habits. <button onClick={loadHabits}>Try again</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <p style={{ fontWeight: 500, fontSize: 18, margin: 0 }}>Your habits</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 0" }}>
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <a href="/habits/new">
          <button style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-plus" style={{ fontSize: 16 }} aria-hidden="true" />
            New habit
          </button>
        </a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
        <StatCard label="Active habits" value={activeCount} />
        <StatCard label="Longest streak" value={`${longestOverall} days`} />
      </div>

      {habits.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {habits.map((habit) => (
            <HabitCard key={habit.id} {...habit} onToggle={handleToggle} />
          ))}
        </div>
      )}

      {activity.length > 0 && (
        <div style={{ background: "var(--surface-1)", borderRadius: 12, padding: "1rem 1.25rem", marginTop: "1.5rem" }}>
          <p style={{ fontWeight: 500, fontSize: 15, margin: "0 0 10px" }}>Partner activity</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activity.map((item) => {
              const initials = (item.partner.name ?? item.partner.email).slice(0, 2).toUpperCase();
              return (
                <div
                  key={item.partnershipId}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "var(--bg-accent, #E1F5EE)",
                        color: "var(--text-accent, #0F6E56)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {initials}
                    </div>
                    <p style={{ fontSize: 14, margin: 0 }}>
                      {item.partner.name ?? item.partner.email}
                      {item.topHabit
                        ? ` — ${item.topHabit.currentStreak} day streak on "${item.topHabit.title}"`
                        : " — no habits yet"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleNudge(item.partnershipId)}
                    disabled={!item.canNudge || nudging === item.partnershipId}
                    style={{ fontSize: 13, padding: "6px 12px" }}
                    title={item.canNudge ? "Send a nudge" : "You've already nudged them recently"}
                  >
                    <i className="ti ti-bell" style={{ fontSize: 14, marginRight: 4 }} aria-hidden="true" />
                    {nudging === item.partnershipId ? "Sending…" : item.canNudge ? "Nudge" : "Nudged"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: "var(--surface-1)", borderRadius: "var(--radius, 12px)", padding: "1rem" }}>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 500, margin: 0 }}>{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "3rem 1rem",
        color: "var(--text-secondary)",
        border: "1px dashed var(--border)",
        borderRadius: 12,
      }}
    >
      <p style={{ margin: "0 0 8px" }}>No habits yet.</p>
      <a href="/habits/new">
        <button>Create your first habit</button>
      </a>
    </div>
  );
}