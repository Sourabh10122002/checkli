import { useState } from 'react';
import { ChecklistBuilder } from './components/ChecklistBuilder';
import { Calendar } from './components/Calendar';

function App() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="app-container">
      <header className="main-header">
        <div className="logo" onClick={() => setIsBuilding(false)} style={{ cursor: 'pointer' }}>Checkli</div>
        <nav>
          <button className="btn-secondary" onClick={() => setIsBuilding(false)}>Log in</button>
          <button className="btn-primary" onClick={() => setIsBuilding(true)}>Make a free checklist</button>
        </nav>
      </header>
      <main>
        {isBuilding ? (
          <div style={{ display: 'flex', gap: '2rem', maxWidth: '1200px', margin: '0 auto', padding: '0 1rem', alignItems: 'flex-start' }}>
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
          </section>
        )}
      </main>
    </div>
  )
}

export default App
