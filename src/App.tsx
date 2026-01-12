import { useState, useEffect } from 'react';
import { ChecklistBuilder } from './components/ChecklistBuilder';
import { Calendar } from './components/Calendar';

function App() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="app-container">
      <header className="main-header">
        <div className="logo" onClick={() => setIsBuilding(false)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/logo.png" alt="Checkli Logo" style={{ height: '32px', width: '32px', borderRadius: '6px' }} />
          Checkli
        </div>
        <nav>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </button>
          {/* <button className="btn-secondary" onClick={() => setIsBuilding(false)}>Log in</button> */}
          <button className="btn-primary" onClick={() => setIsBuilding(true)}>Make a free checklist</button>
        </nav>
      </header>
      <main>
        {isBuilding ? (
          <div className="builder-layout">
            <Calendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
            <div style={{ flex: 1 }}>
              <ChecklistBuilder selectedDate={selectedDate} />
            </div>
          </div>
        ) : (
          <section className="hero">
            <h1>Make free checklists, and recurring team processes.</h1>
            <p className="subtitle">It's free, simple, and effective.</p>
            <div className="hero-actions">
              <button className="btn-primary large" onClick={() => setIsBuilding(true)}>Make a free checklist</button>
            </div>
            <div className="hero-image-container">
              <img src="/hero.png" alt="Checkli Dashboard Interface" />
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
