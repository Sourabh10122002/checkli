import { useCallback, useEffect, useState } from 'react';
import { ChecklistBuilder } from './components/ChecklistBuilder';
import { Calendar } from './components/Calendar';
import { UncheckedTasksPanel } from './components/UncheckedTasksPanel';

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

function App() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [theme, setTheme] = useState(readStoredTheme);
  const [isStuck, setIsStuck] = useState(false);
  const [cardsRefreshSignal, setCardsRefreshSignal] = useState(0);
  const [builderRefreshSignal, setBuilderRefreshSignal] = useState(0);

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

  const handleTaskChecked = useCallback(() => {
    setCardsRefreshSignal((value) => value + 1);
    setBuilderRefreshSignal((value) => value + 1);
  }, []);

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
          <div className="builder-layout">
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
            <h1>Make free checklists and <em>recurring team processes</em>.</h1>
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
              <img src="/hero.webp" alt="A Checkli checklist beside a calendar of past days" width={1600} height={917} decoding="async" fetchPriority="high" />
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
