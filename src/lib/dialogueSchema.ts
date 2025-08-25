// src/lib/dialogueSchema.ts
import { z } from 'zod';

const Buckets = z.object({
  GOOD: z.array(z.string()),
  BAD:  z.array(z.string()),
  OK:   z.array(z.string())
});

export const CharacterSchema = z
  .object({
    greetings:         z.array(z.string()),
    ask_mood:          z.array(z.string()),
    ask_action:        z.array(z.string()),
    memo_placeholders: z.array(z.string()),
    praise:            z.record(z.array(z.string())),
    completed_day:     z.array(z.string()),
    see_you:           z.array(z.string()),
    // ← 今回追加分（optionalにしておく）
    review_summary:    Buckets.optional(),
    review_suggestion: Buckets.optional()
  })
  .passthrough(); // 予期せぬキーが来ても落ちないように

export const DialogueSchema = z.object({
  alpaca:   CharacterSchema,
  otter:    CharacterSchema,
  squirrel: CharacterSchema,
  common: z.object({
    praise: z.record(z.array(z.string()))
  })
}).strict();