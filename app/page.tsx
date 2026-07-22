"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";

type Fraction = { n: number; d: number };
type Question = {
  prompt: string;
  hint: string;
  choices: string[];
  answer: string;
  visual: Fraction;
  explanation: string;
  operation?: string;
};

const WORLDS = [
  { name: "Fraction Basics", icon: "🍕", color: "#ff6b58", blurb: "Parts, wholes, numerator and denominator" },
  { name: "Equivalent Fractions", icon: "🧩", color: "#8d63ff", blurb: "Different numbers, same value" },
  { name: "Compare Fractions", icon: "⚖️", color: "#22b8cf", blurb: "Greater than, less than and equal" },
  { name: "Add Fractions", icon: "➕", color: "#ff9f1c", blurb: "Add like and unlike denominators" },
  { name: "Subtract Fractions", icon: "➖", color: "#f04f78", blurb: "Take away parts step by step" },
  { name: "Multiply Fractions", icon: "✖️", color: "#18a66a", blurb: "Top × top and bottom × bottom" },
  { name: "Divide Fractions", icon: "➗", color: "#3867d6", blurb: "Keep, change, flip and multiply" },
  { name: "Mixed Number Master", icon: "🏆", color: "#ef7b2d", blurb: "Improper fractions and mixed numbers" },
] as const;

const LEVELS_PER_WORLD = 30;
const QUESTIONS_PER_LEVEL = 5;
const TOTAL_LEVELS = WORLDS.length * LEVELS_PER_WORLD;
const TOTAL_QUESTIONS = TOTAL_LEVELS * QUESTIONS_PER_LEVEL;

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : Math.abs(a);
}

function simplify(f: Fraction): Fraction {
  const g = gcd(f.n, f.d) || 1;
  return { n: f.n / g, d: f.d / g };
}

function fractionText(f: Fraction, mixed = false): string {
  const s = simplify(f);
  if (s.d === 1) return String(s.n);
  if (mixed && s.n > s.d) {
    const whole = Math.floor(s.n / s.d);
    const rest = s.n % s.d;
    return rest ? `${whole} ${rest}/${s.d}` : String(whole);
  }
  return `${s.n}/${s.d}`;
}

function seeded(seed: number) {
  let x = Math.sin(seed * 999.91) * 43758.5453;
  return () => {
    x = Math.sin(x) * 43758.5453;
    return x - Math.floor(x);
  };
}

function shuffled<T>(items: T[], random: () => number): T[] {
  return [...items].sort(() => random() - 0.5);
}

function distractors(answer: Fraction, random: () => number, mixed = false): string[] {
  const correct = fractionText(answer, mixed);
  const values = new Set<string>([correct]);
  const simple = simplify(answer);
  let guard = 0;
  while (values.size < 4 && guard < 40) {
    guard += 1;
    const bumpN = Math.floor(random() * 5) - 2;
    const bumpD = Math.floor(random() * 5) - 2;
    const candidate = {
      n: Math.max(1, simple.n + bumpN),
      d: Math.max(2, simple.d + bumpD),
    };
    values.add(fractionText(candidate, mixed));
  }
  return shuffled([...values].slice(0, 4), random);
}

function makeQuestion(level: number, round: number): Question {
  const world = Math.min(WORLDS.length - 1, Math.floor((level - 1) / LEVELS_PER_WORLD));
  const local = (level - 1) % LEVELS_PER_WORLD;
  const random = seeded(level * 101 + round * 17 + world * 71);
  const maxD = Math.min(12, 4 + Math.floor(local / 4));
  const d1 = 2 + Math.floor(random() * (maxD - 1));
  const d2 = 2 + Math.floor(random() * (maxD - 1));
  const n1 = 1 + Math.floor(random() * Math.max(1, d1 - 1));
  const n2 = 1 + Math.floor(random() * Math.max(1, d2 - 1));
  const a = { n: n1, d: d1 };
  const b = { n: n2, d: d2 };

  if (world === 0) {
    const answer = fractionText(a);
    return {
      prompt: `What fraction of the circle is coloured?`,
      hint: `Count the coloured parts, then count all equal parts.`,
      choices: distractors(a, random),
      answer,
      visual: a,
      explanation: `${n1} part${n1 === 1 ? " is" : "s are"} coloured out of ${d1} equal parts, so the fraction is ${answer}. The top number is the numerator. The bottom number is the denominator.`,
    };
  }

  if (world === 1) {
    const factor = 2 + Math.floor(random() * 4);
    const answer = { n: n1 * factor, d: d1 * factor };
    return {
      prompt: `Which fraction is equivalent to ${fractionText(a)}?`,
      hint: `Multiply the numerator and denominator by the same number.`,
      choices: distractors(answer, random),
      answer: fractionText(answer),
      visual: a,
      operation: `${n1}/${d1} × ${factor}/${factor}`,
      explanation: `Multiply both numbers by ${factor}: ${n1} × ${factor} = ${answer.n} and ${d1} × ${factor} = ${answer.d}. The value stays the same.`,
    };
  }

  if (world === 2) {
    const left = n1 * d2;
    const right = n2 * d1;
    const answer = left === right ? "=" : left > right ? ">" : "<";
    return {
      prompt: `Choose the correct sign: ${fractionText(a)}  ?  ${fractionText(b)}`,
      hint: `Cross multiply to compare the two fractions.`,
      choices: shuffled([">", "<", "=", "Not sure"], random),
      answer,
      visual: a,
      operation: `${n1} × ${d2} = ${left}  •  ${n2} × ${d1} = ${right}`,
      explanation: `Cross multiply. The left result is ${left} and the right result is ${right}. Therefore ${fractionText(a)} ${answer} ${fractionText(b)}.`,
    };
  }

  if (world === 3 || world === 4) {
    const common = d1 * d2;
    const topA = n1 * d2;
    const topB = n2 * d1;
    const adding = world === 3;
    const raw = adding
      ? { n: topA + topB, d: common }
      : topA >= topB
        ? { n: topA - topB, d: common }
        : { n: topB - topA, d: common };
    const first = !adding && topA < topB ? b : a;
    const second = !adding && topA < topB ? a : b;
    const answer = simplify(raw);
    return {
      prompt: `Solve ${fractionText(first)} ${adding ? "+" : "−"} ${fractionText(second)}`,
      hint: `Make the denominators the same before working with the numerators.`,
      choices: distractors(answer, random, true),
      answer: fractionText(answer, true),
      visual: first,
      operation: `${topA}/${common} ${adding ? "+" : "−"} ${topB}/${common}`,
      explanation: `Use ${common} as a common denominator. Work with the numerators, then simplify. The answer is ${fractionText(answer, true)}.`,
    };
  }

  if (world === 5) {
    const raw = { n: n1 * n2, d: d1 * d2 };
    const answer = simplify(raw);
    return {
      prompt: `Multiply ${fractionText(a)} × ${fractionText(b)}`,
      hint: `Multiply the top numbers, then multiply the bottom numbers.`,
      choices: distractors(answer, random, true),
      answer: fractionText(answer, true),
      visual: a,
      operation: `${n1} × ${n2} / ${d1} × ${d2}`,
      explanation: `${n1} × ${n2} = ${raw.n} and ${d1} × ${d2} = ${raw.d}. Simplify ${raw.n}/${raw.d} to get ${fractionText(answer, true)}.`,
    };
  }

  if (world === 6) {
    const raw = { n: n1 * d2, d: d1 * n2 };
    const answer = simplify(raw);
    return {
      prompt: `Divide ${fractionText(a)} ÷ ${fractionText(b)}`,
      hint: `Keep the first fraction, change ÷ to ×, then flip the second fraction.`,
      choices: distractors(answer, random, true),
      answer: fractionText(answer, true),
      visual: a,
      operation: `${fractionText(a)} × ${d2}/${n2}`,
      explanation: `Flip ${fractionText(b)} to ${d2}/${n2}, then multiply. Simplify the result to get ${fractionText(answer, true)}.`,
    };
  }

  const whole = 1 + Math.floor(random() * 5);
  const partN = 1 + Math.floor(random() * (d1 - 1));
  const improper = { n: whole * d1 + partN, d: d1 };
  const answer = fractionText(improper, true);
  return {
    prompt: `Change ${improper.n}/${improper.d} into a mixed number.`,
    hint: `Divide the numerator by the denominator. The remainder becomes the new numerator.`,
    choices: distractors(improper, random, true),
    answer,
    visual: improper,
    operation: `${improper.n} ÷ ${improper.d}`,
    explanation: `${improper.d} goes into ${improper.n} ${whole} time${whole === 1 ? "" : "s"}, with ${partN} left over. The mixed number is ${answer}.`,
  };
}

function FractionModel({ fraction }: { fraction: Fraction }) {
  const proper = fraction.n % fraction.d;
  const coloured = proper === 0 ? fraction.d : proper;
  const degrees = Math.min(360, (coloured / fraction.d) * 360);
  return (
    <div className="fraction-model" aria-label={`${coloured} of ${fraction.d} parts coloured`}>
      <div className="pie" style={{ "--fill": `${degrees}deg`, "--slices": fraction.d } as React.CSSProperties}>
        <span>{fractionText(fraction, true)}</span>
      </div>
      <div className="model-caption"><strong>{coloured}</strong> coloured part{coloured === 1 ? "" : "s"} out of <strong>{fraction.d}</strong></div>
    </div>
  );
}

function FractionBadge({ value }: { value: string }) {
  const [wholeOrNum, den] = value.split("/");
  if (!den) return <span className="whole-number">{value}</span>;
  const pieces = wholeOrNum.split(" ");
  const numerator = pieces.pop();
  return <span className="fraction-badge">{pieces.length > 0 && <b>{pieces.join(" ")}</b>}<span><i>{numerator}</i><i>{den}</i></span></span>;
}

export default function Home() {
  const [world, setWorld] = useState(0);
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [completed, setCompleted] = useState(0);
  const [stars, setStars] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const gameRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = JSON.parse(localStorage.getItem("gb-fraction-progress") || "{}");
      setCompleted(Number(saved.completed || 0));
      setStars(Number(saved.stars || 0));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const question = useMemo(() => makeQuestion(level, round), [level, round]);
  const localLevel = ((level - 1) % LEVELS_PER_WORLD) + 1;

  function playTone(ok: boolean) {
    if (!soundOn) return;
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = ok ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(ok ? 620 : 180, ctx.currentTime);
    if (ok) oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.3);
  }

  function choose(value: string) {
    if (correct === true) return;
    const isCorrect = value === question.answer;
    setChoice(value);
    setCorrect(isCorrect);
    playTone(isCorrect);
  }

  function nextQuestion() {
    if (round < QUESTIONS_PER_LEVEL - 1) {
      setRound((r) => r + 1);
    } else {
      const newCompleted = Math.max(completed, level);
      const newStars = stars + 3;
      setCompleted(newCompleted);
      setStars(newStars);
      localStorage.setItem("gb-fraction-progress", JSON.stringify({ completed: newCompleted, stars: newStars }));
      if (level < TOTAL_LEVELS) {
        const next = level + 1;
        setLevel(next);
        setWorld(Math.floor((next - 1) / LEVELS_PER_WORLD));
      }
      setRound(0);
    }
    setChoice(null);
    setCorrect(null);
    setShowHint(false);
  }

  function selectLevel(index: number) {
    const absolute = world * LEVELS_PER_WORLD + index + 1;
    setLevel(absolute);
    setRound(0);
    setChoice(null);
    setCorrect(null);
    setShowHint(false);
    requestAnimationFrame(() => gameRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function startAdventure() {
    const next = Math.min(TOTAL_LEVELS, Math.max(1, completed + 1));
    setLevel(next);
    setWorld(Math.floor((next - 1) / LEVELS_PER_WORLD));
    requestAnimationFrame(() => gameRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <main>
      <header className="topbar">
        <a className="logo" href="#home" aria-label="GameBosh Fraction Quest home">
          <img src="./gamebosh-kids-logo.webp" alt="GameBosh" />
          <span>Fraction Quest<small>Learn • Play • Grow</small></span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#worlds">Learning map</a>
          <a href="#learn">Fraction guide</a>
          <a href="#parents">For parents</a>
        </nav>
        <div className="header-actions">
          <button className="sound-btn" onClick={() => setSoundOn((value) => !value)} aria-label={soundOn ? "Turn sound off" : "Turn sound on"}>{soundOn ? "🔊" : "🔇"}</button>
          <a className="more-games" href="https://gamebosh.com/" target="_blank" rel="noreferrer">More games <span>↗</span></a>
        </div>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <div className="eyebrow"><span>✨</span> Free maths adventure for kids</div>
          <h1>Fractions become <em>fun</em> when you play.</h1>
          <p>Explore colourful worlds, solve friendly challenges and learn every fraction skill with simple step-by-step explanations.</p>
          <div className="hero-actions">
            <button className="primary" onClick={startAdventure}>▶ Start learning free</button>
            <a className="secondary" href="#learn">See how fractions work</a>
          </div>
          <div className="trust-row">
            <span><b>{TOTAL_LEVELS}</b> guided levels</span>
            <span><b>{TOTAL_QUESTIONS.toLocaleString()}+</b> fraction challenges</span>
            <span><b>100%</b> free & kid-safe</span>
          </div>
        </div>
        <div className="hero-art">
          <img src="./gamebosh-kids-banner.webp" alt="GameBosh free online games with colourful gaming icons" />
          <div className="floating-card pizza-card"><span className="mini-pie" /> <b>3/4</b><small>Three quarters!</small></div>
          <div className="floating-card streak-card">🔥 <b>5 day streak</b></div>
          <span className="orbit orbit-one">⅓</span><span className="orbit orbit-two">½</span><span className="orbit orbit-three">⅝</span>
        </div>
      </section>

      <section className="stats-strip" aria-label="Learning benefits">
        <div>🧠 <span><b>Learn by doing</b><small>Instant visual feedback</small></span></div>
        <div>🎯 <span><b>Built for ages 7–13</b><small>Easy words and clear steps</small></span></div>
        <div>🏅 <span><b>Progress that feels good</b><small>Levels, stars and celebrations</small></span></div>
        <div>📱 <span><b>Play anywhere</b><small>Mobile, tablet or computer</small></span></div>
      </section>

      <section className="worlds-section" id="worlds">
        <div className="section-heading">
          <div><span className="kicker">Your learning map</span><h2>Eight worlds. Every fraction skill.</h2></div>
          <p>Start with pizza slices and grow into a mixed-number master. Each world has 30 carefully paced levels.</p>
        </div>
        <div className="world-grid">
          {WORLDS.map((item, index) => {
            const worldStart = index * LEVELS_PER_WORLD + 1;
            const doneInWorld = Math.max(0, Math.min(LEVELS_PER_WORLD, completed - worldStart + 1));
            return (
              <button key={item.name} className={`world-card ${world === index ? "active" : ""}`} style={{ "--world": item.color } as React.CSSProperties} onClick={() => { setWorld(index); setLevel(worldStart); setRound(0); setChoice(null); setCorrect(null); }}>
                <span className="world-icon">{item.icon}</span>
                <span className="world-number">World {index + 1}</span>
                <strong>{item.name}</strong>
                <small>{item.blurb}</small>
                <span className="world-progress"><i style={{ width: `${(doneInWorld / LEVELS_PER_WORLD) * 100}%` }} /></span>
                <span className="level-count">{doneInWorld}/{LEVELS_PER_WORLD} levels</span>
              </button>
            );
          })}
        </div>

        <div className="level-picker">
          <div><span>{WORLDS[world].icon}</span><div><small>Choose a level</small><strong>{WORLDS[world].name}</strong></div></div>
          <div className="level-dots">
            {Array.from({ length: LEVELS_PER_WORLD }, (_, index) => {
              const absolute = world * LEVELS_PER_WORLD + index + 1;
              const isDone = absolute <= completed;
              const isCurrent = absolute === level;
              const isLocked = absolute > completed + 1 && completed > 0;
              return <button key={absolute} className={`${isDone ? "done" : ""} ${isCurrent ? "current" : ""}`} onClick={() => selectLevel(index)} disabled={isLocked} aria-label={`Level ${index + 1}${isLocked ? " locked" : ""}`}>{isDone ? "✓" : isLocked ? "🔒" : index + 1}</button>;
            })}
          </div>
        </div>
      </section>

      <section className="game-zone" ref={gameRef} aria-labelledby="game-title">
        <div className="game-topline">
          <div><span className="game-world">{WORLDS[world].icon} World {world + 1}</span><h2 id="game-title">Level {localLevel}: {WORLDS[world].name}</h2></div>
          <div className="player-stats"><span>⭐ {stars}</span><span>Question {round + 1}/{QUESTIONS_PER_LEVEL}</span></div>
        </div>
        <div className="question-progress"><i style={{ width: `${((round + (correct ? 1 : 0)) / QUESTIONS_PER_LEVEL) * 100}%` }} /></div>
        <div className="game-board">
          <div className="visual-panel">
            <FractionModel fraction={question.visual} />
            <button className="hint-button" onClick={() => setShowHint((value) => !value)}>💡 {showHint ? "Hide hint" : "Give me a hint"}</button>
            {showHint && <p className="hint-bubble">{question.hint}</p>}
          </div>
          <div className="challenge-panel">
            <span className="question-label">Your challenge</span>
            <h3>{question.prompt}</h3>
            {question.operation && <div className="operation">{question.operation}</div>}
            <div className="choice-grid">
              {question.choices.map((value) => {
                const state = choice === value ? (correct ? "correct" : "wrong") : correct && value === question.answer ? "correct" : "";
                return <button key={value} className={state} onClick={() => choose(value)}><FractionBadge value={value} />{state === "correct" && <span>✓</span>}{state === "wrong" && <span>×</span>}</button>;
              })}
            </div>
            {correct === false && <div className="feedback try-again"><b>Almost!</b> Look at the hint and try another answer.</div>}
            {correct === true && (
              <div className="feedback success">
                <div className="confetti" aria-hidden="true">🎉 ✨ ⭐ 🎊</div>
                <b>Brilliant work!</b>
                <p>{question.explanation}</p>
                <button className="primary next" onClick={nextQuestion}>{round === QUESTIONS_PER_LEVEL - 1 ? "Finish level" : "Next question"} →</button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="learn-section" id="learn">
        <div className="section-heading centered"><div><span className="kicker">Fraction guide</span><h2>Small parts, big ideas.</h2></div><p>Short explanations help children understand the “why”, not only remember a rule.</p></div>
        <div className="lesson-grid">
          <article className="lesson-card featured"><span className="lesson-icon">🍕</span><div><small>Start here</small><h3>What is a fraction?</h3><p>A fraction shows <b>part of a whole</b>. If a pizza has 8 equal slices and you take 3, you have <FractionBadge value="3/8" />.</p></div><div className="lesson-pie" /></article>
          <article className="lesson-card"><span className="lesson-icon purple">↕</span><h3>Parts of a fraction</h3><div className="big-fraction"><b>3</b><b>8</b></div><p><b>3 is the numerator:</b> parts we have.<br/><b>8 is the denominator:</b> equal parts in all.</p></article>
          <article className="lesson-card"><span className="lesson-icon green">＝</span><h3>Equivalent fractions</h3><div className="equation"><FractionBadge value="1/2" /> = <FractionBadge value="2/4" /> = <FractionBadge value="4/8" /></div><p>They look different, but they show the same amount.</p></article>
          <article className="lesson-card wide"><span className="lesson-icon orange">＋</span><div><h3>Adding different denominators</h3><p>Find a common denominator, change both fractions, then add the numerators.</p></div><div className="step-line"><span><b>1</b> Find the LCM</span><i>→</i><span><b>2</b> Make equal parts</span><i>→</i><span><b>3</b> Add and simplify</span></div></article>
          <article className="lesson-card"><span className="lesson-icon blue">✕</span><h3>Multiplication</h3><p>Multiply top × top and bottom × bottom. Simplify at the end.</p><div className="equation"><FractionBadge value="2/3" /> × <FractionBadge value="3/5" /> = <FractionBadge value="2/5" /></div></article>
          <article className="lesson-card"><span className="lesson-icon pink">↻</span><h3>Division</h3><p>Keep the first fraction, change ÷ into ×, then flip the second fraction.</p><div className="rule-pill">Keep • Change • Flip</div></article>
        </div>
      </section>

      <section className="parents-section" id="parents">
        <div className="parent-copy"><span className="kicker">Made for happy learning</span><h2>Clear for kids. Reassuring for grown-ups.</h2><p>Fraction Quest combines visual models, progressive practice and immediate explanations. Progress is stored only on the child’s device—no account is required.</p><ul><li>✓ No adverts inside lessons</li><li>✓ No chat or social features</li><li>✓ Works with keyboard, touch and mouse</li><li>✓ Gentle sounds can be turned off</li></ul><a className="primary button-link" href="#worlds">Explore the learning map</a></div>
        <div className="report-card"><div className="report-head"><span>Weekly progress</span><b>Great work! 🚀</b></div><div className="report-ring"><span><b>82%</b>accuracy</span></div><div className="report-bars"><span>Basics <i><b style={{width:"96%"}} /></i></span><span>Equivalent <i><b style={{width:"78%"}} /></i></span><span>Adding <i><b style={{width:"64%"}} /></i></span></div></div>
      </section>

      <section className="seo-section">
        <div><span className="kicker">Free online fraction games</span><h2>Learn fractions through play</h2><p>GameBosh Fraction Quest is a free educational maths game for children. It covers proper fractions, improper fractions, mixed numbers, equivalent fractions, comparing fractions, simplifying, addition, subtraction, multiplication and division.</p></div>
        <div className="faq-list"><details><summary>What age is Fraction Quest for?</summary><p>The lessons are designed mainly for children aged 7 to 13, but beginners of any age can practise.</p></details><details><summary>How many levels are included?</summary><p>There are {TOTAL_LEVELS} levels across eight learning worlds, with {TOTAL_QUESTIONS.toLocaleString()} generated challenges.</p></details><details><summary>Does the game explain wrong answers?</summary><p>Yes. Hints and short step-by-step explanations help children understand each method.</p></details><details><summary>Is this fractions game free?</summary><p>Yes. Children can learn and play without creating an account.</p></details></div>
      </section>

      <footer>
        <div className="footer-brand"><img src="./gamebosh-kids-logo.webp" alt="GameBosh"/><p>Fraction Quest makes maths colourful, clear and fun.</p></div>
        <div><b>Learn</b><a href="#worlds">Fraction levels</a><a href="#learn">Fraction guide</a><a href="#parents">For parents</a></div>
        <div><b>GameBosh</b><a href="https://gamebosh.com/" target="_blank" rel="noreferrer">More free games</a><a href="https://gamebosh.com/" target="_blank" rel="noreferrer">GameBosh.com</a></div>
        <p className="copyright">© 2026 GameBosh. Learn, play and grow.</p>
      </footer>
    </main>
  );
}
