"use client";

interface HabitCardProps {
  id: string;
  title: string;
  frequency: "DAILY" | "WEEKLY";
  currentStreak: number;
  color: string;
  icon: string;
  completedToday: boolean;
  onToggle: (id: string) => void;
}

const COLOR_MAP: Record<string, { bg: string; fg: string }> = {
  teal: { bg: "#E1F5EE", fg: "#0F6E56" },
  coral: { bg: "#FAECE7", fg: "#C25B3D" },
  purple: { bg: "#EEEDFE", fg: "#6C5CE7" },
};

export function HabitCard({
  id,
  title,
  frequency,
  currentStreak,
  color,
  icon,
  completedToday,
  onToggle,
}: HabitCardProps) {
  const palette = COLOR_MAP[color] ?? COLOR_MAP.teal;

  return (
    <div
      style={{
        background: "var(--surface-2)",
        border: "0.5px solid var(--border)",
        borderRadius: 12,
        padding: "1rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <a
        href={`/habits/${id}`}
        style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, color: "inherit", textDecoration: "none" }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: palette.bg,
            color: palette.fg,
            flexShrink: 0,
          }}
        >
          <i className={`ti ${icon}`} style={{ fontSize: 18 }} aria-hidden="true" />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 500, fontSize: 15, margin: 0 }}>{title}</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 0" }}>
            {frequency === "DAILY" ? "Daily" : "Weekly"} · {currentStreak} day
            {currentStreak === 1 ? "" : "s"} streak
          </p>
        </div>
      </a>
      <button
        aria-label={completedToday ? "Mark incomplete" : "Mark complete"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle(id);
        }}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: completedToday ? palette.fg : "transparent",
          border: completedToday ? "none" : "1px solid var(--border)",
          color: completedToday ? "white" : "var(--text-secondary)",
          flexShrink: 0,
        }}
      >
        <i className="ti ti-check" style={{ fontSize: 18 }} aria-hidden="true" />
      </button>
    </div>
  );
}