import { useState, useEffect, useRef, useCallback } from "react";

const PASSAGE = `The forgetful penguin accidentally enrolled in cooking school and somehow graduated at the top of her class. Her specialty was an enormous purple cake decorated with tiny rubber elephants. The judges were speechless during the final competition because nobody expected a penguin to master the art of French pastry. She celebrated by sliding down the banister and landing in a giant bowl of chocolate pudding.`;

const QUESTIONS = [
  {
    q: "What kind of animal enrolled in cooking school?",
    options: ["A giraffe", "A penguin", "A flamingo", "A raccoon"],
    correct: 1,
  },
  {
    q: "What was her specialty dish?",
    options: [
      "A green soup with marshmallows",
      "An enormous purple cake with tiny rubber elephants",
      "A chocolate souffl\u00e9 with sprinkles",
      "A tower of enchiladas",
    ],
    correct: 1,
  },
  {
    q: "Why were the judges speechless?",
    options: [
      "The cake exploded",
      "She forgot to show up",
      "Nobody expected a penguin to master French pastry",
      "She spoke in a foreign language",
    ],
    correct: 2,
  },
  {
    q: "How did she celebrate?",
    options: [
      "She threw confetti at the judges",
      "She did a backflip off the stage",
      "She slid down the banister into chocolate pudding",
      "She called her mother",
    ],
    correct: 2,
  },
];

const REFLECTIONS = [
  "What emotions came up while you were trying to read?",
  "Did you want to give up? At what point?",
  "Which version felt the most frustrating, and why?",
  "Imagine experiencing this level of effort in every class, every day, for years. How might that shape the way a student sees themselves?",
  "How might this experience change the way you respond to a student who seems disengaged or avoidant during reading?",
];

/* ── Distortion engines ── */

function stripVowels(text) {
  return text
    .split("")
    .map((ch) => ("aeiouAEIOU".includes(ch) ? "\u00A0" : ch))
    .join("");
}

const CONFUSABLE = {
  b: "d", d: "b", p: "q", q: "p",
  m: "w", w: "m", n: "u", u: "n",
};

function getDistortion(char, index) {
  if (char === " " || !/[a-zA-Z]/.test(char)) return { char, style: {} };
  const seed = ((index * 7 + 13) * 31) % 100;
  const style = {};
  let displayChar = char;

  if (seed < 30) {
    const clips = [
      "polygon(0 0,100% 0,100% 60%,0 60%)",
      "polygon(0 40%,100% 40%,100% 100%,0 100%)",
      "polygon(20% 0,100% 0,100% 100%,20% 100%)",
      "polygon(0 0,80% 0,80% 100%,0 100%)",
    ];
    style.clipPath = clips[seed % clips.length];
  } else if (seed < 50) {
    style.transform = `rotate(${((seed % 5) - 2) * 5}deg)`;
    style.display = "inline-block";
  } else if (seed < 65) {
    style.transform = "scaleX(-1)";
    style.display = "inline-block";
  } else if (seed < 80) {
    style.opacity = 0.2 + (seed % 3) * 0.1;
  }

  if (seed % 7 === 0 && CONFUSABLE[char.toLowerCase()]) {
    displayChar =
      char === char.toUpperCase()
        ? CONFUSABLE[char.toLowerCase()].toUpperCase()
        : CONFUSABLE[char.toLowerCase()];
  }
  if (seed % 5 === 0) style.letterSpacing = `${(seed % 3) + 1}px`;

  return { char: displayChar, style };
}

function jumbleWord(word) {
  if (word.length <= 3) return word;
  const mid = word.slice(1, -1).split("");
  for (let i = mid.length - 1; i > 0; i--) {
    const j = ((i * 7 + 3) * 13) % (i + 1);
    [mid[i], mid[j]] = [mid[j], mid[i]];
  }
  return word[0] + mid.join("") + word[word.length - 1];
}

function jumbleText(text) {
  return text.replace(/[a-zA-Z]+/g, (m) => jumbleWord(m));
}

/* ── Small components ── */

function DistortedFragments({ text }) {
  let idx = 0;
  return (
    <p className="sim-passage mono">
      {text.split("").map((ch) => {
        const { char, style } = getDistortion(ch, idx);
        idx++;
        return <span key={idx} style={style}>{char}</span>;
      })}
    </p>
  );
}

function MonoText({ text }) {
  return <p className="sim-passage mono">{text}</p>;
}

function Timer({ startTime }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const iv = setInterval(
      () => setElapsed(Math.floor((Date.now() - startTime) / 1000)),
      250
    );
    return () => clearInterval(iv);
  }, [startTime]);
  return (
    <div className="timer">
      {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}
    </div>
  );
}

function StepIndicator({ current, total }) {
  return (
    <div className="steps">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`step-dot ${i < current ? "done" : ""} ${i === current ? "active" : ""}`}
        />
      ))}
    </div>
  );
}

const VERSIONS = [
  {
    key: "readA",
    label: "A",
    name: "Vowels removed",
    desc: "All vowels have been stripped. Try to read and understand the passage.",
    color: "#534AB7",
    render: (t) => <MonoText text={stripVowels(t)} />,
  },
  {
    key: "readB",
    label: "B",
    name: "Letter fragments",
    desc: "Letters are clipped, rotated, mirrored, and swapped. The shapes are unreliable.",
    color: "#D85A30",
    render: (t) => <DistortedFragments text={t} />,
  },
  {
    key: "readC",
    label: "C",
    name: "Jumbled letters",
    desc: "Letters within each word have been rearranged. First and last letters stay in place.",
    color: "#1D9E75",
    render: (t) => <MonoText text={jumbleText(t)} />,
  },
];

const STEPS = ["intro", "readA", "readB", "readC", "questions", "reveal", "reflect"];

/* ── Main app ── */

export default function App() {
  const [step, setStep] = useState("intro");
  const [readStart, setReadStart] = useState(null);
  const [times, setTimes] = useState({});
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const ref = useRef(null);

  const scroll = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const startVersion = (key) => {
    setStep(key);
    setReadStart(Date.now());
    setTimeout(scroll, 80);
  };

  const finishVersion = (key, next) => {
    setTimes((p) => ({
      ...p,
      [key]: Math.floor((Date.now() - readStart) / 1000),
    }));
    if (next) startVersion(next);
    else {
      setStep("questions");
      setCurrentQ(0);
      setTimeout(scroll, 80);
    }
  };

  const selectAnswer = (qi, ai) => {
    setAnswers((p) => ({ ...p, [qi]: ai }));
    setShowResult(true);
    setTimeout(() => {
      setShowResult(false);
      if (qi < QUESTIONS.length - 1) setCurrentQ(qi + 1);
      else {
        setStep("reveal");
        setTimeout(scroll, 80);
      }
    }, 1400);
  };

  const reset = () => {
    setStep("intro");
    setAnswers({});
    setTimes({});
    setReadStart(null);
    setCurrentQ(0);
    setTimeout(scroll, 80);
  };

  const score = Object.entries(answers).filter(
    ([qi, ai]) => QUESTIONS[parseInt(qi)].correct === ai
  ).length;

  const stepIndex = STEPS.indexOf(step);
  const fmt = (s) =>
    s != null
      ? `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`
      : "--";

  const vIdx = { readA: 0, readB: 1, readC: 2 };
  const cv = VERSIONS[vIdx[step]];

  return (
    <div ref={ref} className="sim-container">

      {/* Header */}
      <header className="sim-header">
        <p className="sim-brand">RTN Communication &amp; Literacy</p>
        <h1 className="sim-title">Dyslexia simulation</h1>
        <p className="sim-subtitle">Inspired by the work of Daniel Britton</p>
      </header>

      <StepIndicator current={stepIndex} total={STEPS.length} />

      {/* ── INTRO ── */}
      {step === "intro" && (
        <div className="sim-section">
          <div className="card">
            <h2 className="card-title">Before you begin</h2>
            <p className="card-text">
              You are about to read the same short passage three different
              times, each with a different type of distortion applied. These
              distortions simulate some of what it can feel like when the brain
              struggles to decode print.
            </p>
            <p className="card-text">
              After all three versions, you will answer four comprehension
              questions about the story. Your reading time for each version
              will be recorded.
            </p>

            <div className="version-chips">
              {VERSIONS.map((v) => (
                <div key={v.key} className="chip">
                  <span className="chip-dot" style={{ background: v.color }}>
                    {v.label}
                  </span>
                  <span className="chip-label">{v.name}</span>
                </div>
              ))}
            </div>

            <div className="card-footer-note">
              This is not a test of intelligence. It is designed to help you
              feel what many struggling readers experience every day.
            </div>
          </div>

          <div className="center">
            <button className="btn-primary btn-lg" onClick={() => startVersion("readA")}>
              Start
            </button>
          </div>
        </div>
      )}

      {/* ── READ VERSIONS ── */}
      {["readA", "readB", "readC"].includes(step) && cv && (
        <div className="sim-section">
          <div className="read-header">
            <div className="read-meta">
              <span className="version-badge" style={{ background: cv.color }}>
                {cv.label}
              </span>
              <div>
                <p className="read-name">{cv.name}</p>
                <p className="read-count">Version {cv.label} of 3</p>
              </div>
            </div>
            <Timer startTime={readStart} />
          </div>

          <p className="read-desc">{cv.desc}</p>

          <div className="passage-box" style={{ borderLeftColor: cv.color }}>
            {cv.render(PASSAGE)}
          </div>

          <div className="center">
            <button
              className="btn-primary"
              onClick={() => {
                if (step === "readA") finishVersion("readA", "readB");
                else if (step === "readB") finishVersion("readB", "readC");
                else finishVersion("readC", null);
              }}
            >
              {step === "readC" ? "Go to questions" : "Next version"}
            </button>
            <p className="hint">Take as much time as you need</p>
          </div>
        </div>
      )}

      {/* ── QUESTIONS ── */}
      {step === "questions" && (
        <div className="sim-section">
          <div className="q-header">
            <h2 className="section-title">Comprehension</h2>
            <span className="q-count">
              {currentQ + 1} of {QUESTIONS.length}
            </span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${((currentQ + 1) / QUESTIONS.length) * 100}%` }}
            />
          </div>

          <p className="q-text">{QUESTIONS[currentQ].q}</p>

          <div className="options">
            {QUESTIONS[currentQ].options.map((opt, oi) => {
              const sel = answers[currentQ] === oi;
              const cor = QUESTIONS[currentQ].correct === oi;
              let cls = "option-btn";
              if (showResult && sel && cor) cls += " correct";
              else if (showResult && sel && !cor) cls += " wrong";
              else if (showResult && !sel && cor) cls += " reveal-correct";

              return (
                <button
                  key={oi}
                  disabled={showResult}
                  onClick={() => selectAnswer(currentQ, oi)}
                  className={cls}
                >
                  <span className="option-letter">
                    {showResult && sel && cor ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : showResult && sel && !cor ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      String.fromCharCode(65 + oi)
                    )}
                  </span>
                  <span className="option-text">{opt}</span>
                  {showResult && sel && (
                    <span className="option-feedback">
                      {cor ? "Correct" : "Not quite"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── REVEAL ── */}
      {step === "reveal" && (
        <div className="sim-section">
          <h2 className="section-title">Here is what you were reading</h2>

          <div className="stats-grid">
            {[
              { label: "Version A", sub: "Vowels", val: fmt(times.readA), color: "#534AB7" },
              { label: "Version B", sub: "Fragments", val: fmt(times.readB), color: "#D85A30" },
              { label: "Version C", sub: "Jumbled", val: fmt(times.readC), color: "#1D9E75" },
              { label: "Score", sub: "Correct", val: `${score}/${QUESTIONS.length}`, color: "#1B7A6E" },
            ].map((s, i) => (
              <div key={i} className="stat-card" style={{ borderTopColor: s.color }}>
                <p className="stat-label">{s.label}</p>
                <p className="stat-value">{s.val}</p>
                <p className="stat-sub">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="reveal-passage">
            <p className="clean-text">{PASSAGE}</p>
          </div>

          <div className="callout callout-warning">
            <p>
              A fluent reader decodes this passage in about 15 to 20 seconds.
              For many students with reading disabilities, every paragraph in
              every subject requires the kind of effort you just experienced,
              while also managing emotions, social demands, and the fear of
              being called on.
            </p>
          </div>

          <div className="center">
            <button
              className="btn-primary"
              onClick={() => { setStep("reflect"); setTimeout(scroll, 80); }}
            >
              Continue to reflection
            </button>
          </div>
        </div>
      )}

      {/* ── REFLECT ── */}
      {step === "reflect" && (
        <div className="sim-section">
          <h2 className="section-title">Reflection</h2>
          <p className="section-desc">
            Sit with these questions. There are no right answers. The goal is
            to connect this experience to the students you work with.
          </p>

          <div className="reflections">
            {REFLECTIONS.map((r, i) => (
              <div key={i} className="reflection-card">
                <p>{r}</p>
              </div>
            ))}
          </div>

          <div className="takeaway">
            <p className="takeaway-title">Key takeaway</p>
            <p className="takeaway-text">
              The problem is not effort, motivation, or intelligence. The brain
              processes print differently. When we understand this, we stop
              asking "why won't they try?" and start asking "what do they
              need?"
            </p>
          </div>

          <div className="center">
            <button className="btn-outline" onClick={reset}>
              Start over
            </button>
          </div>

          <div className="resources-link">
            <p>
              Want to learn more about literacy and dyslexia?{" "}
              <a href="https://rachelslp.org/resources" target="_blank" rel="noopener noreferrer">
                Click here for a curated list of free resources
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="sim-footer">
        <p>RTN Communication &amp; Literacy</p>
        <p>rachelslp.org</p>
      </footer>
    </div>
  );
}
