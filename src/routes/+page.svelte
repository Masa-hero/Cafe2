<script>
  import { onMount } from 'svelte';
  import { addLog, getTodaysLog, clearTodaysLog, getWeekLogs } from '$lib/database.js';
  import { LABEL_ICONS } from '$lib/assets';

  // サーバから受け取るデータ
  export let data;

  // リアクティブに受け取り
  $: currentScreen     = data.currentScreen;
  $: selectedRoom      = data.selectedRoom;
  $: selectedCharacter = data.selectedCharacter;
  $: dailyQuote        = data.dailyQuote;
  $: askMoodText       = data.askMoodText;
  $: askActionText     = data.askActionText;
  $: memoPlaceholder   = data.memoPlaceholder;
  $: completedDayText  = data.completedDayText;
  $: seeYouText        = data.seeYouText;
  $: dialogues         = data.dialogues;
  $: reviewSummary     = data.reviewSummary;
  $: reviewSuggestion  = data.reviewSuggestion;

  // 旧変数名との互換
  $: lineGreeting         = dailyQuote;
  $: lineAskMood          = askMoodText;
  $: lineAskAction        = askActionText;
  $: lineMemoPlaceholder  = memoPlaceholder;
  $: lineCompletedTitle   = completedDayText;
  $: lineSeeYou           = seeYouText;
  $: lineReviewSummary    = reviewSummary;
  $: lineReviewSuggestion = reviewSuggestion;

  // 状態
  let isLoading = true;
  let selectedAction = null;
  let selectedMood = '';
  let memoText = '';

  // 週カレンダー
  let weekDays = [];
  let calendarReady = false;
  let weekOffset = 0;

  // アイコン辞書
  const SRC_BY_KEY = {};
  (LABEL_ICONS ?? []).forEach(i => { SRC_BY_KEY[i.key] = i.src; });

  const MOOD_ICONS = {
    GOOD: SRC_BY_KEY['GOOD'] || '/Images/icons/good.png',
    OK:   SRC_BY_KEY['OK']   || '/Images/icons/ok.png',
    BAD:  SRC_BY_KEY['BAD']  || '/Images/icons/bad.png'
  };

  const ACTION_ITEMS = [
    { key: '水',       text: '水を飲んだ' },
    { key: '歩いた',   text: '歩いた/運動した' },
    { key: '野菜',     text: '野菜を食べた' },
    { key: '甘いもの', text: '甘いもの控えた' },
    { key: 'よく眠れた', text: 'よく眠れた' },
    { key: '朝ごはん', text: '朝ごはん食べた' },
    { key: '外食控えた', text: '外食控えた' },
    { key: 'リラックス', text: 'リラックスできた' },
    { key: '気分いい',   text: '気分が良かった' },
    { key: '無理せず',   text: '無理せず休めた' }
  ].map(i => ({ ...i, src: SRC_BY_KEY[i.key] }));

  function srcOf(key) {
    return SRC_BY_KEY[key] || '';
  }

  function getRandomLine(lines) {
    if (!lines || !Array.isArray(lines) || lines.length === 0) return '';
    return lines[Math.floor(Math.random() * lines.length)];
  }

  function pickPraise(charId, key) {
    const cand =
      dialogues?.[charId]?.praise?.[key] ??
      dialogues?.common?.praise?.[key] ??
      ['素晴らしいですね！'];
    return getRandomLine(cand);
  }

  const weekdays = ['日','月','火','水','木','金','土'];
  function fmtDayLabel(d) {
    const day = d.getDate();
    const w = weekdays[d.getDay()];
    return `${w} ${day}`;
  }

  function fmtRangeLabel() {
    if (!weekDays || weekDays.length === 0) return '';
    const first = weekDays[0].date;
    const last  = weekDays[weekDays.length - 1].date;
    const f = `${first.getMonth()+1}/${first.getDate()}`;
    const l = `${last.getMonth()+1}/${last.getDate()}`;
    return `${f} - ${l}`;
  }

  async function loadWeekCalendar(offset = weekOffset) {
    calendarReady = false;
    weekOffset = offset;
    const days = await getWeekLogs(weekOffset);
    weekDays = days.map(d => ({ ...d, open: false }));
    calendarReady = true;
  }

  // スワイプ検出
  let touchStartX = 0;
  let touchStartY = 0;
  const SWIPE_THRESHOLD = 50;
  function onTouchStart(e) {
    const t = e.touches?.[0];
    if (!t) return;
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }
  function onTouchEnd(e) {
    const t = e.changedTouches?.[0];
    if (!t) return;
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx < 0) loadWeekCalendar(weekOffset + 1);
      else        loadWeekCalendar(weekOffset - 1);
    }
  }

  // キーボード
  function onKeydown(e) {
    if (currentScreen !== 'review') return;
    if (e.key === 'ArrowLeft')  loadWeekCalendar(weekOffset - 1);
    if (e.key === 'ArrowRight') loadWeekCalendar(weekOffset + 1);
  }

  function handleStartDailyLog() { currentScreen = 'mood'; }
  function handleShowReview() { currentScreen = 'review'; loadWeekCalendar(0); }
  function handleMoodSelection(mood) { selectedMood = mood; currentScreen = 'actions'; }
  function handleActionSelection(action) { selectedAction = action; currentScreen = 'memo'; }

  async function handleSave() {
    if (!selectedAction) return;
    const logEntry = {
      date: new Date().toISOString(),
      mood: selectedMood,
      action: selectedAction.key,
      memo: memoText
    };
    await addLog(logEntry);
    currentScreen = 'completed';
  }

  onMount(async () => {
    window.addEventListener('keydown', onKeydown);

    if (currentScreen === 'review') {
      await loadWeekCalendar(0);
      isLoading = false;
      return;
    }

    const p = new URLSearchParams(location.search);
    if (p.get('reset') === '1') {
      await clearTodaysLog();
    }

    const todaysLog = await getTodaysLog();
    currentScreen = todaysLog ? 'completed' : 'mood';
    isLoading = false;
  });
</script>

<main>
  {#if !isLoading}
    {#if selectedRoom}
      <img class="room-background" src={selectedRoom} alt="背景" />
    {/if}
    <div class="content-wrapper">
      {#if selectedCharacter}
        {#if currentScreen === 'review'}
          <div class="prompt-nobg">
            <h1>今週の振り返り</h1>
            <p class="review-text">{lineReviewSummary}</p>
            <p class="review-suggestion">{lineReviewSuggestion}</p>
          </div>

          <div class="calendar-nav">
            <button class="nav-btn" on:click={() => loadWeekCalendar(weekOffset - 1)}>◀</button>
            <span class="range-label">{fmtRangeLabel()}</span>
            <button class="nav-btn" on:click={() => loadWeekCalendar(weekOffset + 1)}>▶</button>
          </div>

          <div class="calendar" on:touchstart={onTouchStart} on:touchend={onTouchEnd}>
            {#if calendarReady}
              {#each weekDays as d}
                <div class="cal-cell">
                  <div class="cal-head">
                    <span class="cal-date">{fmtDayLabel(d.date)}</span>
                  </div>

                  <div class="cal-icons">
                    {#if d?.log?.mood}
                      <!-- 記録がある日の気分 -->
                      <img class="cal-icon mood" src={MOOD_ICONS[d.log.mood]} alt={d.log.mood} title={d.log.mood} />
                    {:else}
                      {#if d.date <= new Date()}
                        <!-- 過去の未記録日は休養アイコン -->
                        <img class="cal-icon mood" src={SRC_BY_KEY['無理せず']} alt="休み" title="休んだ日" />
                      {:else}
                        <!-- 未来は空白 -->
                      {/if}
                    {/if}

                    {#if d?.log?.action}
                      <!-- 記録がある日の行動 -->
                      <img class="cal-icon action" src={srcOf(d.log.action)} alt={d.log.action} title={d.log.action} />
                    {/if}
                  </div>

                  {#if d?.log?.memo}
                    <button class="memo-toggle" on:click={() => d.open = !d.open}>
                      {d.open ? 'メモを閉じる' : 'メモを見る'}
                    </button>
                    {#if d.open}
                      <p class="memo-text">{d.log.memo}</p>
                    {/if}
                  {/if}
                </div>
              {/each}
            {:else}
              <p style="color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.7);">読み込み中...</p>
            {/if}
          </div>

          <img class="character" src={selectedCharacter.src} alt={selectedCharacter.alt} />
          <div class="memo-container">
            <button class="save-button" on:click={handleStartDailyLog}>今日の記録へ戻る</button>
          </div>
        {/if}

        {#if currentScreen === 'mood'}
          <div class="prompt-nobg">
            <h1 style="white-space: pre-wrap;">{lineGreeting}</h1>
            <h2>{lineAskMood}</h2>
          </div>
          <img class="character" src={selectedCharacter.src} alt={selectedCharacter.alt} />
          <div class="mood-buttons">
            <button class="icon-button mood" on:click={() => handleMoodSelection('GOOD')}>
              <img src={MOOD_ICONS.GOOD} alt="GOOD" />
            </button>
            <button class="icon-button mood" on:click={() => handleMoodSelection('OK')}>
              <img src={MOOD_ICONS.OK} alt="OK" />
            </button>
            <button class="icon-button mood" on:click={() => handleMoodSelection('BAD')}>
              <img src={MOOD_ICONS.BAD} alt="BAD" />
            </button>
          </div>
        {/if}

        {#if currentScreen === 'actions'}
          <div class="prompt-nobg small">
            <h2>{lineAskAction}</h2>
          </div>
          <img class="character character-actions" src={selectedCharacter.src} alt={selectedCharacter.alt} />
          <div class="action-grid">
            {#each ACTION_ITEMS as item}
              <div class="action-item">
                <button class="icon-button" on:click={() => handleActionSelection(item)}>
                  <img src={item.src} alt={item.key} />
                </button>
                <p class="action-label">{item.text}</p>
              </div>
            {/each}
          </div>
        {/if}

        {#if currentScreen === 'memo'}
          <div class="prompt-nobg">
            <h2>{pickPraise(selectedCharacter.id, selectedAction?.key)}</h2>
          </div>
          <img class="character character-actions" src={selectedCharacter.src} alt={selectedCharacter.alt} />
          <div class="memo-container">
            <textarea class="memo-input" placeholder={lineMemoPlaceholder} bind:value={memoText}></textarea>
            <button class="save-button" on:click={handleSave}>記録する</button>
          </div>
        {/if}

        {#if currentScreen === 'completed'}
          <div class="prompt-nobg">
            <h1>{lineCompletedTitle}</h1>
            <h2>{lineSeeYou}</h2>
          </div>
          <img class="character" src={selectedCharacter.src} alt={selectedCharacter.alt} />
          <div class="memo-container">
            <button class="save-button" on:click={handleShowReview}>今週の振り返りを見る</button>
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</main>

<style>
  main { position: absolute; inset: 0; width: 100%; height: 100%; }
  .room-background { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; }
  .content-wrapper { position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; }

  .prompt-nobg { position: absolute; top: 6%; width: 92%; max-width: 560px; text-align: center; }
  .prompt-nobg.small { top: 4%; }
  h1 { font-size: 1.25rem; margin: 0 0 .4em; color: #fff; text-shadow: 0 2px 6px rgba(0,0,0,.7); }
  h2 { font-size: 1rem;  margin: 0; color: #fff; text-shadow: 0 2px 6px rgba(0,0,0,.7); }
  .review-text, .review-suggestion { color: #fff; text-shadow: 0 2px 6px rgba(0,0,0,.7); margin: .4em auto; max-width: 560px; }

  .character { max-height: 45%; object-fit: contain; margin-top: 50px; }
  .character-actions { max-height: 30%; margin-top: 0; }

  .mood-buttons { position: absolute; bottom: 15%; display: flex; gap: 24px; }
  .icon-button { background: none; border: none; padding: 0; cursor: pointer; transition: transform .15s ease; }
  .icon-button:hover { transform: scale(1.12); }
  .icon-button img { width: 64px; height: 64px; display: block; }
  .icon-button.mood img { width: 72px; height: 72px; }

  .action-grid { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 16px; width: 92%; max-width: 560px; margin-top: 20px; }
  .action-item { display: flex; flex-direction: column; align-items: center; text-align: center; width: 92px; }
  .action-item .action-label { margin: 6px 0 0; font-size: .8rem; color: #fff; font-weight: 700; text-shadow: 0 2px 6px rgba(0,0,0,.7); }

                   .memo-container {
                     position: absolute;
                     bottom: 10%;
                     width: 90%;
                     max-width: 420px;
                     display: flex;
                     flex-direction: column;
                     align-items: center;
                     gap: 15px;
                   }

                   .memo-input {
                     width: 100%;
                     height: 80px;
                     border: none;
                     border-radius: 10px;
                     padding: 10px;
                     font-size: 1em;
                     box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                   }

                   .save-button {
                     width: 100%;
                     padding: 15px;
                     border: none;
                     border-radius: 10px;
                     background-color: #ff9800;
                     color: white;
                     font-size: 1.1em;
                     font-weight: bold;
                     cursor: pointer;
                     box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                     transition: background-color 0.2s;
                   }
                   .save-button:hover { background-color: #f57c00; }

                   /* カレンダー部分 */
                   .calendar-nav {
                     position: absolute;
                     top: 18%;
                     width: 94%;
                     max-width: 720px;
                     display: flex;
                     align-items: center;
                     justify-content: center;
                     gap: 12px;
                     color: #fff;
                     text-shadow: 0 2px 6px rgba(0,0,0,.7);
                     font-weight: 700;
                   }
                   .nav-btn {
                     border: none;
                     border-radius: 8px;
                     padding: 6px 10px;
                     background: rgba(0,0,0,0.25);
                     color: #fff;
                     cursor: pointer;
                   }
                   .range-label { min-width: 140px; text-align: center; }

                   .calendar {
                     position: absolute;
                     top: 24%;
                     width: 94%;
                     max-width: 720px;
                     display: grid;
                     grid-template-columns: repeat(7, 1fr);
                     gap: 8px;
                   }
                   .cal-cell { text-align: center; color: #fff; }
                   .cal-head { margin-bottom: 4px; font-size: .8rem; font-weight: bold; }
                   .cal-icons { display: flex; flex-direction: column; gap: 4px; align-items: center; }
                   .cal-icon { width: 32px; height: 32px; }
                   .memo-toggle { border: none; background: rgba(0,0,0,0.3); color:#fff; padding: 2px 6px; border-radius: 4px; cursor: pointer; font-size: .7rem; }
                   .memo-text { font-size: .75rem; color:#fff; margin: 4px 0; white-space: pre-wrap; }
                   </style>