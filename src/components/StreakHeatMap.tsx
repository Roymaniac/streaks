"use client";

import { useMemo } from "react";
import { toDayKey } from "@/utils/helper";

interface StreakHeatmapProps {
  logDates: Date[];
  weeksToShow?: number;
  accentColor?: string;
}

export function StreakHeatmap({
  logDates,
  weeksToShow = 26,
  accentColor = "#0F6E56",
}: StreakHeatmapProps) {
  const loggedSet = useMemo(
    () => new Set(logDates.map(toDayKey)),
    [logDates]
  );

  // build a weeksToShow x 7 grid ending today, starting on a Sunday so rows
  // line up the way GitHub's does
  const weeks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDays = weeksToShow * 7;
    const start = new Date(today);
    start.setDate(start.getDate() - totalDays + 1);
    // rewind to the previous Sunday so the grid's first column is a full week
    start.setDate(start.getDate() - start.getDay());

    const grid: { date: Date; key: string; logged: boolean; future: boolean }[][] = [];
    const cursor = new Date(start);

    for (let w = 0; w < weeksToShow; w++) {
      const col: (typeof grid)[number] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(cursor);
        const key = toDayKey(date);
        col.push({
          date,
          key,
          logged: loggedSet.has(key),
          future: date.getTime() > today.getTime(),
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      grid.push(col);
    }
    return grid;
  }, [weeksToShow, loggedSet]);

  return (
    <div>
      <h2 className="sr-only">
        Habit completion history, last {weeksToShow} weeks
      </h2>
      <div style={{ display: "flex", gap: "3px", overflowX: "auto", padding: "2px" }}>
        {weeks.map((col, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            {col.map((cell) => (
              <div
                key={cell.key}
                title={cell.logged ? `Completed ${cell.key}` : cell.key}
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "2px",
                  background: cell.future
                    ? "transparent"
                    : cell.logged
                    ? accentColor
                    : "var(--surface-1)",
                  border: cell.future ? "none" : "0.5px solid var(--border)",
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "8px",
          fontSize: "12px",
          color: "var(--text-secondary)",
        }}
      >
        <span>Less</span>
        <div style={{ width: 12, height: 12, borderRadius: 2, background: "var(--surface-1)", border: "0.5px solid var(--border)" }} />
        <div style={{ width: 12, height: 12, borderRadius: 2, background: accentColor }} />
        <span>More</span>
      </div>
    </div>
  );
}