/**
 * Pure streak-calculation functions — no DB, no React, no side effects.
 * Kept isolated so they're trivial to unit test and reason about.
 *
 * Design decisions (worth stating explicitly, they're the interesting part):
 *
 * 1. Dates are compared as calendar days in the user's own timezone, not UTC
 *    instants. A log made at 11pm and one made at 1am the "next" day should
 *    NOT count as consecutive just because they're <24h apart, and a log at
 *    11:59pm / 12:01am in the SAME local day should count as one day, not two.
 *    We therefore normalize every date to a "YYYY-MM-DD" string key before
 *    doing any comparison — never diff raw Date/timestamp values.
 *
 * 2. "Today" not yet logged does not break a streak. If you completed a daily
 *    habit yesterday and haven't logged today yet, your streak is still alive
 *    (you have until end of today to keep it). It only breaks once a full day
 *    is skipped.
 *
 * 3. Weekly habits use ISO week boundaries (Mon–Sun), not "any rolling 7 days".
 */

import { toDayKey, toWeekKey } from "@/utils/helper";
export type Frequency = "DAILY" | "WEEKLY";

interface StreakResult {
    currentStreak: number;
    longestStreak: number;
}

/**
 * Calculate current + longest streak for a DAILY habit.
 * `logDates` need not be sorted or deduped — this function handles both.
 */
function calculateDailyStreak(logDates: Date[], today: Date): StreakResult {
    if (logDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const uniqueDayKeys = Array.from(new Set(logDates.map(toDayKey))).sort();
    const todayKey = toDayKey(today);

    let longestStreak = 1;
    let running = 1;

    for (let i = 1; i < uniqueDayKeys.length; i++) {
        const prev = new Date(uniqueDayKeys[i - 1]);
        const curr = new Date(uniqueDayKeys[i]);
        const dayDiff = Math.round((curr.getTime() - prev.getTime()) / 86400000);

        if (dayDiff === 1) {
            running += 1;
        } else {
            running = 1;
        }
        longestStreak = Math.max(longestStreak, running);
    }

    // current streak: walk backward from today (or yesterday, if today isn't
    // logged yet) counting consecutive days
    const lastLoggedKey = uniqueDayKeys[uniqueDayKeys.length - 1];
    const daysSinceLastLog = Math.round(
        (new Date(todayKey).getTime() - new Date(lastLoggedKey).getTime()) /
        86400000
    );

    // more than 1 day gap since the last log means the streak is broken,
    // even if today hasn't been logged yet
    if (daysSinceLastLog > 1) {
        return { currentStreak: 0, longestStreak };
    }

    let currentStreak = 1;
    for (let i = uniqueDayKeys.length - 1; i > 0; i--) {
        const prev = new Date(uniqueDayKeys[i - 1]);
        const curr = new Date(uniqueDayKeys[i]);
        const dayDiff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
        if (dayDiff === 1) {
            currentStreak += 1;
        } else {
            break;
        }
    }

    return { currentStreak, longestStreak };
}

/** Calculate current + longest streak for a WEEKLY habit (>=1 log per ISO week). */
function calculateWeeklyStreak(logDates: Date[], today: Date): StreakResult {
    if (logDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const uniqueWeekKeys = Array.from(new Set(logDates.map(toWeekKey))).sort();
    const currentWeekKey = toWeekKey(today);

    // helper: are two week keys consecutive? compare by re-deriving a sortable
    // (year, week) pair rather than string diffing, since "2026-W52" -> "2027-W01"
    // is consecutive but not adjacent lexicographically at the year boundary
    const parse = (wk: string) => {
        const [y, w] = wk.split("-W").map(Number);
        return y * 53 + w; // 53 is a safe upper bound on ISO weeks/year
    };

    let longestStreak = 1;
    let running = 1;
    for (let i = 1; i < uniqueWeekKeys.length; i++) {
        running = parse(uniqueWeekKeys[i]) - parse(uniqueWeekKeys[i - 1]) === 1 ? running + 1 : 1;
        longestStreak = Math.max(longestStreak, running);
    }

    const lastWeekKey = uniqueWeekKeys[uniqueWeekKeys.length - 1];
    const weekGap = parse(currentWeekKey) - parse(lastWeekKey);
    if (weekGap > 1) return { currentStreak: 0, longestStreak };

    let currentStreak = 1;
    for (let i = uniqueWeekKeys.length - 1; i > 0; i--) {
        if (parse(uniqueWeekKeys[i]) - parse(uniqueWeekKeys[i - 1]) === 1) {
            currentStreak += 1;
        } else {
            break;
        }
    }

    return { currentStreak, longestStreak };
}

/**
 * Public entry point. Pass every logged date for the habit (unsorted is
 * fine) plus "today" (inject this rather than calling `new Date()` inside —
 * makes the function deterministic and trivial to unit test).
 */
export function calculateStreak(
    logDates: Date[],
    frequency: Frequency,
    today: Date = new Date()
): StreakResult {
    return frequency === "DAILY"
        ? calculateDailyStreak(logDates, today)
        : calculateWeeklyStreak(logDates, today);
}