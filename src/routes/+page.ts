// src/routes/+page.ts
import type { PageLoad } from './$types';
import { CHARACTERS, ROOMS } from '$lib/assets';
import dialoguesRaw from '$lib/dialogue.json';
import { DialogueSchema } from '$lib/dialogue.schema'; // ←ファイル名に注意

type Bucket = 'GOOD' | 'OK' | 'BAD';

const rnd = <T>(arr?: T[] | null, fallback = ''): T | string => {
  if (!arr || arr.length === 0) return fallback;
  return arr[Math.floor(Math.random() * arr.length)];
};

export const load: PageLoad = ({ url }) => {
  // JSON をスキーマ検証（失敗しても動作は続ける）
  const parsed = DialogueSchema.safeParse(dialoguesRaw);
  if (!parsed.success) {
    console.error('dialogue.json schema error:', parsed.error);
  }
  const dialogues = parsed.success ? parsed.data : (dialoguesRaw as any);

  // ランダムな部屋・キャラ
  const selectedRoom = rnd(ROOMS) as string;
  const selectedCharacter = rnd(CHARACTERS) as (typeof CHARACTERS)[number];
  const charId = selectedCharacter?.id as keyof typeof dialogues;

  // キャラ別の文言
  const dailyQuote       = rnd(dialogues?.[charId]?.greetings as string[], 'こんにちは！') as string;
  const askMoodText      = rnd(dialogues?.[charId]?.ask_mood as string[], '今日の調子は？') as string;
  const askActionText    = rnd(dialogues?.[charId]?.ask_action as string[], '今日は何をした？') as string;
  const memoPlaceholder  = rnd(dialogues?.[charId]?.memo_placeholders as string[], 'ひとことメモ（任意）') as string;
  const completedDayText = rnd(dialogues?.[charId]?.completed_day as string[], '今日も一日、お疲れさまでした！') as string;
  const seeYouText       = rnd(dialogues?.[charId]?.see_you as string[], 'また明日、会いに来てくださいね。') as string;

  // 週次レビュー（デバッグ用クエリ）
  const wantReview = url.searchParams.get('review') === '1';
  const bucket = (url.searchParams.get('bucket')?.toUpperCase() as Bucket) || 'OK';

  const summaryArr    = dialogues?.[charId]?.review_summary?.[bucket]    as string[] | undefined;
  const suggestionArr = dialogues?.[charId]?.review_suggestion?.[bucket] as string[] | undefined;

  const reviewSummary    = (rnd(summaryArr) || '') as string;
  const reviewSuggestion = (rnd(suggestionArr) || '') as string;

  return {
    currentScreen: wantReview ? 'review' : 'mood',
    selectedRoom,
    selectedCharacter,
    dailyQuote,
    askMoodText,
    askActionText,
    memoPlaceholder,
    completedDayText,
    seeYouText,
    dialogues,          // フロントで praise 等に使う
    reviewSummary,
    reviewSuggestion
  };
};