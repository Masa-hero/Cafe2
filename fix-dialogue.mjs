// fix-dialogue.mjs
import fs from 'node:fs';

const inPath  = 'src/lib/dialogue.json';
const outPath = 'src/lib/dialogue.fixed.json';

let s = fs.readFileSync(inPath, 'utf8');

// 1) 行全体が "..." だけの行を削除
s = s.split(/\r?\n/).filter(l => l.trim() !== '...').join('\n');

// 2) see_you の直後に review_* が来るときのカンマ補正
//   ]\n  "review_summary" になるように強制
s = s.replace(/\]\s*\n\s*"review_summary"/g, '],\n  "review_summary"');

// 3) see_you ブロック内に紛れ込んだ余計な ] / ], を除去
//   "see_you": [ ... ] の "..." 範囲をざっくり走査して閉じ括弧の行を除去
s = s.replace(
  /("see_you"\s*:\s*\[)([\s\S]*?)(\])(?=\s*,?\s*(?:\n\s*"review_|\n\s*}|\n\s*"$))/g,
  (_m, head, body /* inside */, tail /* ] */) => {
    const cleaned = body
      .split('\n')
      .filter(line => !/^\s*\],?\s*$/.test(line)) // 内部の ] / ], 行を捨てる
      .join('\n')
      .replace(/,\s*(\n\s*\])/g, '$1'); // 末尾要素の余計なカンマを除去
    return head + cleaned + tail;
  }
);

// 4) トップレベルでのカンマ抜け:  ...}\n"otter": { → ...},\n"otter": {
s = s.replace(/\}\s*\n\s*"otter"\s*:\s*\{/g, '},\n  "otter": {');
s = s.replace(/\}\s*\n\s*"squirrel"\s*:\s*\{/g, '},\n  "squirrel": {');

// 5) review_summary / review_suggestion が重複して並ぶケースを整理
//   先頭のペアだけを残し、その後ろに同キーが連続したら削除
function dropDuplicateReviews(block) {
  // block はキャラオブジェクトのテキスト
  // 最初に出てくる review_summary / review_suggestion を保持し、それ以降の同キーを削除
  const keepKeys = new Set();
  return block.replace(
    /(\n\s*"review_(summary|suggestion)"\s*:\s*\{[\s\S]*?\})(?=(\s*,)?\s*(\n\s*"[a-z_]+")|\s*\n\})/g,
    (m, full, key /* summary|suggestion */) => {
      if (keepKeys.has(key)) {
        return ''; // 2回目以降は落とす
      }
      keepKeys.add(key);
      return full;
    }
  );
}

// キャラ単位で分割して重複除去
s = s.replace(/("alpaca"\s*:\s*\{[\s\S]*?)(\n\s*\},\s*\n\s*"otter"\s*:\s*\{)/, (m, a, sep) => dropDuplicateReviews(a) + sep);
s = s.replace(/("otter"\s*:\s*\{[\s\S]*?)(\n\s*\},\s*\n\s*"squirrel"\s*:\s*\{)/, (m, a, sep) => dropDuplicateReviews(a) + sep);
s = s.replace(/("squirrel"\s*:\s*\{[\s\S]*?)(\n\s*\}\s*\n\})/, (m, a, tail) => dropDuplicateReviews(a) + tail);

// 最後に厳密パースで検証
try {
  JSON.parse(s);
} catch (e) {
  console.error('❌ まだ JSON として無効です:', e.message);
  // 失敗しても中間成果を書き出しておきます
  fs.writeFileSync(outPath.replace('.json', '.broken.json'), s);
  process.exit(1);
}

fs.writeFileSync(outPath, s);
console.log('✅ 修正済みを書き出しました:', outPath);