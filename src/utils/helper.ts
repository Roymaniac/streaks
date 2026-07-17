/** Normalize a Date (or date-like string) to a local YYYY-MM-DD key. */
export function toDayKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/** ISO week key, e.g. "2026-W29", using Monday as the first day of the week. */
export function toWeekKey(date: Date): string {
    const d = new Date(date);
    // shift to the Thursday of this week per ISO 8601 week-numbering rules
    const day = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
    d.setDate(d.getDate() - day + 3);
    const firstThursday = new Date(d.getFullYear(), 0, 4);
    const week =
        1 +
        Math.round(
            ((d.getTime() - firstThursday.getTime()) / 86400000 -
                3 +
                ((firstThursday.getDay() + 6) % 7)) /
            7
        );
    return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}