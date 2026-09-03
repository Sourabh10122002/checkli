import { useMemo, useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameDay,
    isSameMonth,
    isToday,
    addMonths,
    subMonths
} from 'date-fns';
import { listDateKeysWithContent } from '../storage';

interface CalendarProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    refreshSignal?: number;
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Calendar({ selectedDate, onDateSelect, refreshSignal = 0 }: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(selectedDate);
    const [lastSelectedDate, setLastSelectedDate] = useState(selectedDate);

    // Follow the selection when it lands outside the month on screen. Adjusted during
    // render rather than in an effect so the grid never paints on the stale month.
    if (lastSelectedDate !== selectedDate) {
        setLastSelectedDate(selectedDate);
        if (!isSameMonth(currentMonth, selectedDate)) {
            setCurrentMonth(selectedDate);
        }
    }

    // Scans every stored day, so it must only re-run when the data actually changed.
    const datesWithContent = useMemo(() => {
        void refreshSignal;
        return listDateKeysWithContent();
    }, [refreshSignal]);

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        return eachDayOfInterval({
            start: startOfWeek(monthStart),
            end: endOfWeek(endOfMonth(monthStart))
        });
    }, [currentMonth]);

    const goToToday = () => {
        const today = new Date();
        setCurrentMonth(today);
        onDateSelect(today);
    };

    return (
        <section className="calendar-container panel" aria-label="Pick a date">
            <div className="calendar-header">
                <button
                    type="button"
                    className="calendar-nav"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    aria-label="Previous month"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <h2 className="calendar-title" aria-live="polite">{format(currentMonth, 'MMMM yyyy')}</h2>
                <button
                    type="button"
                    className="calendar-nav"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    aria-label="Next month"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            </div>

            <div className="days-row" aria-hidden="true">
                {WEEK_DAYS.map((day) => (
                    <div key={day}>{day.charAt(0)}</div>
                ))}
            </div>

            <div className="calendar-body">
                {calendarDays.map((dateItem) => {
                    const isSelected = isSameDay(dateItem, selectedDate);
                    const isOutside = !isSameMonth(dateItem, currentMonth);
                    const hasContent = datesWithContent.has(format(dateItem, 'yyyy-MM-dd'));

                    return (
                        <button
                            type="button"
                            key={dateItem.toISOString()}
                            className={[
                                'cell',
                                isOutside ? 'outside' : '',
                                isSelected ? 'selected' : '',
                                isToday(dateItem) ? 'today' : ''
                            ].filter(Boolean).join(' ')}
                            onClick={() => onDateSelect(dateItem)}
                            aria-pressed={isSelected}
                            aria-current={isToday(dateItem) ? 'date' : undefined}
                            aria-label={`${format(dateItem, 'EEEE, MMMM do, yyyy')}${hasContent ? ', has a checklist' : ''}`}
                        >
                            {format(dateItem, 'd')}
                            {hasContent && <span className="cell-dot" aria-hidden="true" />}
                        </button>
                    );
                })}
            </div>

            <div className="calendar-footer">
                <p className="calendar-legend"><span aria-hidden="true" />Has a checklist</p>
                <button type="button" className="today-btn" onClick={goToToday}>Today</button>
            </div>
        </section>
    );
}
