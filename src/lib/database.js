import { browser } from '$app/environment';
import { Low } from 'lowdb';
import { LocalStorage } from 'lowdb/browser';

const defaultData = { logs: [] };
let db;

function localDateKey(date = new Date()) {
  return date.toLocaleDateString('sv-SE'); // 例: 2025-08-25
}

if (browser) {
  const adapter = new LocalStorage('db');
  db = new Low(adapter, defaultData);
}

export async function addLog(logEntry) {
  if (!browser) return;
  await db.read();
  if (!Array.isArray(db.data.logs)) db.data.logs = [];

  const now = new Date();
  const entry = {
    ...logEntry,
    dateISO: now.toISOString(),
    dateLocal: localDateKey(now)
  };

  db.data.logs.unshift(entry);
  await db.write();
}

export async function getTodaysLog() {
  if (!browser) return null;
  await db.read();
  const logs = db.data?.logs ?? [];
  const today = localDateKey();

  const todaysLog =
    logs.find(l => l?.dateLocal === today) ||
    logs.find(l => (l?.date ?? l?.dateISO ?? '').slice(0, 10) === new Date().toISOString().slice(0, 10));

  return todaysLog || null;
}

// 週次取得（weekOffset: 0=今週, -1=先週, +1=来週）
export async function getWeekLogs(weekOffset = 0) {
  if (!browser) return [];
  await db.read();
  const logs = db.data?.logs ?? [];

  const days = [];
  const today = new Date();
  const base = new Date(today);
  base.setDate(today.getDate() + weekOffset * 7);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    const key = localDateKey(d);

    const match =
      logs.find(l => l?.dateLocal === key) ||
      logs.find(l => (l?.date ?? l?.dateISO ?? '').slice(0, 10) === d.toISOString().slice(0, 10));

    days.push({
      date: d,
      dateLocal: key,
      log: match || null
    });
  }

  return days;
}

// デバッグ用：今日の記録だけ削除
export async function clearTodaysLog() {
  if (!browser) return;
  await db.read();
  const today = localDateKey();
  db.data.logs = (db.data?.logs ?? []).filter(l => l?.dateLocal !== today);
  await db.write();
}