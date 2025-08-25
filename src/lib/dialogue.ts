// src/lib/dialogue.ts
import raw from '$lib/dialogue.json';
import { DialogueSchema } from '$lib/dialogueSchema';

const result = DialogueSchema.safeParse(raw);
if (!result.success) {
  console.error('dialogue.json schema error:', result.error.format());
}
export const DIALOGUE = result.success ? result.data : { common: {} as any };

const isArray = (v: unknown): v is string[] => Array.isArray(v);
const pick = (arr?: string[]) =>
  isArray(arr) && arr.length ? arr[Math.floor(Math.random() * arr.length)] : '';

export function lineArr(charKey: string, key: keyof typeof DIALOGUE.common, fallback = ''): string {
  // @ts-ignore
  const a = (DIALOGUE as any)?.[charKey]?.[key] as string[] | undefined;
  // @ts-ignore
  const b = (DIALOGUE.common as any)?.[key] as string[] | undefined;
  return pick(a) || pick(b) || fallback;
}

export function praise(charKey: string, actionKey: string, fallback = '素晴らしいですね！'): string {
  // @ts-ignore
  const a = (DIALOGUE as any)?.[charKey]?.praise?.[actionKey] as string[] | undefined;
  // @ts-ignore
  const b = (DIALOGUE.common as any)?.praise?.[actionKey] as string[] | undefined;
  return pick(a) || pick(b) || fallback;
}