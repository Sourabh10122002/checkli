import { useCallback, useEffect, useRef, useState } from 'react';
import { ChecklistBuilder } from './components/ChecklistBuilder';
import { Calendar } from './components/Calendar';
import { UncheckedTasksPanel } from './components/UncheckedTasksPanel';
import { setTaskChecked } from './storage';
import type { UncheckedTask } from './storage';

/** localStorage access itself throws in some privacy modes. */
function readStoredTheme(): string {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    /* fall through to the system preference */
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const HERO_FEATURES = [
  'No account needed',
  'Saved in your browser',
  'Paste screenshots into any item',
];

/** How long an undo stays available after checking a task off from the sidebar. */
const UNDO_TIMEOUT_MS = 7000;

const SECTIONS = [
  {
    title: 'A list for every day',
    body: 'Pick any date and start typing. Yesterday stays exactly where you left it, so a recurring process is just the same list, again tomorrow.',
    icon: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
  },
  {
    title: 'Paste a screenshot in',
    body: 'Copy an image and paste it straight onto any item. Useful when a step needs a reference shot rather than another paragraph of description.',
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </>
    ),
  },
  {
    title: 'Nothing slips through',
    body: 'Anything left unchecked on any day collects in one panel, so a task you skipped last Tuesday is still in front of you today.',
    icon: (
      <>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </>
    ),
  },
];

function App() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [theme, setTheme] = useState(readStoredTheme);
  const [isStuck, setIsStuck] = useState(false);
  const [cardsRefreshSignal, setCardsRefreshSignal] = useState(0);
  const [builderRefreshSignal, setBuilderRefreshSignal] = useState(0);
  const [undoTask, setUndoTask] = useState<UncheckedTask | null>(null);

  // Switching views swaps out the button that was just activated, which leaves focus
  // orphaned on <body>. Move it into the new view so keyboard and screen-reader users
  // continue from the content rather than from wherever the old node happened to sit.
  const builderRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isBuilding) {
      builderRef.current?.focus();
    }
  }, [isBuilding]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* the toggle still works for this session */
    }
  }, [theme]);

  // Drives the header's divider so it only appears once content scrolls beneath it.
  useEffect(() => {
    const onScroll = () => setIsStuck(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Stable identities: these are handed to children that would otherwise treat a new
  // function on every render as a change worth reacting to.
  const handleChecklistDataChange = useCallback(() => {
    setCardsRefreshSignal((value) => value + 1);
  }, []);

  const handleTaskChecked = useCallback((task: UncheckedTask) => {
    setCardsRefreshSignal((value) => value + 1);
    setBuilderRefreshSignal((value) => value + 1);
    setUndoTask(task);
  }, []);

  const handleUndo = useCallback(() => {
    setUndoTask((task) => {
      if (task) {
        setTaskChecked(task.dateKey, task.itemId, false);
        setCardsRefreshSignal((value) => value + 1);
        setBuilderRefreshSignal((value) => value + 1);
      }

      return null;
    });
  }, []);

  // The offer is transient: checking a task off is otherwise silent, and a permanent
  // banner would be noise once the user has moved on.
  useEffect(() => {
    if (!undoTask) {
      return;
    }

    const timer = setTimeout(() => setUndoTask(null), UNDO_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [undoTask]);

  return (
    <div className="app-container">
      <a className="skip-link" href="#main">Skip to main content</a>

      <header className={`main-header ${isStuck ? 'is-stuck' : ''}`}>
        <div className="header-inner">
          <button type="button" className="logo" onClick={() => setIsBuilding(false)}>
            <img src="/logo.png" alt="" width={32} height={32} />
            Checkli
          </button>
          <nav aria-label="Main">
            <button
              type="button"
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>
            {isBuilding ? (
              <button type="button" className="btn-secondary" onClick={() => setIsBuilding(false)}>
                Home
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={() => setIsBuilding(true)}>
                Make a free checklist
              </button>
            )}
          </nav>
        </div>
      </header>

      <main id="main">
        {isBuilding ? (
          <div className="builder-layout" ref={builderRef} tabIndex={-1}>
            <div className="builder-sidebar">
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                refreshSignal={cardsRefreshSignal}
              />
              <UncheckedTasksPanel refreshSignal={cardsRefreshSignal} onTaskChecked={handleTaskChecked} />
            </div>
            <ChecklistBuilder
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              refreshSignal={builderRefreshSignal}
              onDataChange={handleChecklistDataChange}
            />
          </div>
        ) : (
          <section className="hero">
            <p className="hero-eyebrow">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Free, forever
            </p>
            <h1>Make free checklists and <em>recurring team processes</em></h1>
            <p className="subtitle">
              A checklist for every day, kept in one place. Simple, fast, and effective.
            </p>
            <div className="hero-actions">
              <button type="button" className="btn-primary large" onClick={() => setIsBuilding(true)}>
                Make a free checklist
              </button>
              <p className="hero-note">No sign-up. Start in one click.</p>
            </div>
            <ul className="hero-features">
              {HERO_FEATURES.map((feature) => (
                <li key={feature}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="hero-image-container">
              <img src="/hero.webp" alt="A Checkli checklist beside a calendar of past days" width={1600} height={942} decoding="async" fetchPriority="high" />
            </div>

            <section className="features" aria-labelledby="features-heading">
              <h2 id="features-heading">Built for the list you redo every day</h2>
              <div className="feature-grid">
                {SECTIONS.map((section) => (
                  <article className="feature-card" key={section.title}>
                    <span className="feature-icon" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        {section.icon}
                      </svg>
                    </span>
                    <h3>{section.title}</h3>
                    <p>{section.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="cta-band">
              <h2>Start your first checklist</h2>
              <p>It takes one click, and there is nothing to sign up for.</p>
              <button type="button" className="btn-primary large" onClick={() => setIsBuilding(true)}>
                Make a free checklist
              </button>
            </section>
          </section>
        )}
      </main>

      {undoTask && (
        <div className="toast" role="status">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p className="toast-text">Checked off &ldquo;{undoTask.text}&rdquo;</p>
          <button type="button" className="toast-action" onClick={handleUndo}>Undo</button>
          <button
            type="button"
            className="toast-dismiss"
            onClick={() => setUndoTask(null)}
            aria-label="Dismiss"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      <footer className="site-footer">
        <div className="footer-inner">
          <p className="footer-brand">
            <img src="/logo.png" alt="" width={20} height={20} />
            Checkli
          </p>
          <p className="footer-note">
            Your checklists are stored in this browser only &mdash; nothing is uploaded.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
