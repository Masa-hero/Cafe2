  // src/lib/review.ts
  export type Log = { date: string; mood?: 'GOOD'|'OK'|'BAD'|string; action?: string };

  export function filterLast7Days<T extends { date: string }>(logs: T[]): T[] {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return logs.filter((l) => {
      const d = new Date(l.date);
      return d >= start && d <= now;
    });
  }

  export function calcStreak(logs: { date: string }[]): number {
    const byDay = new Set(logs.map((l) => (l.date || '').slice(0, 10)));
    let streak = 0;
    const cur = new Date();
    for (;;) {
      const key = cur.toISOString().slice(0, 10);
      if (!byDay.has(key)) break;
      streak++;
      cur.setDate(cur.getDate() - 1);
    }
    return streak;
  }

  export function topActions(
    logs: { action?: string }[],
    n = 3
  ): { key: string; count: number }[] {
    const map = new Map<string, number>();
    for (const l of logs) {
      if (!l.action) continue;
      map.set(l.action, (map.get(l.action) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n);
  }

  export function moodDist(
    logs: { mood?: 'GOOD'|'OK'|'BAD'|string }[]
  ): Record<'GOOD'|'OK'|'BAD', number> {
    const out = { GOOD: 0, OK: 0, BAD: 0 } as Record<'GOOD'|'OK'|'BAD', number>;
    for (const l of logs) {
      if (l.mood === 'GOOD' || l.mood === 'OK' || l.mood === 'BAD') out[l.mood]++;
    }
    return out;
  }

  export function fillTemplate(tpl: string, vars: Record<string, string | number>): string {
    return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => String(vars[k] ?? ''));
  }