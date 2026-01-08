import { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameDay,
    isToday,
    addMonths,
    subMonths
} from 'date-fns';

interface CalendarProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
}

export function Calendar({ selectedDate, onDateSelect }: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const onNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const onPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate
    });

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <div className="col col-start">
                    <span className="icon" onClick={onPrevMonth}>&#8249;</span>
                </div>
                <div className="col col-center">
                    <span>{format(currentMonth, "MMMM yyyy")}</span>
                </div>
                <div className="col col-end" onClick={onNextMonth}>
                    <span className="icon">&#8250;</span>
                </div>
            </div>

            <div className="days-row">
                {weekDays.map(day => (
                    <div className="col col-center" key={day}>{day}</div>
                ))}
            </div>

            <div className="calendar-body">
                {calendarDays.map((dateItem) => {
                    const isSelected = isSameDay(dateItem, selectedDate);
                    const isCurrentMonth = dateItem.getMonth() === currentMonth.getMonth();

                    return (
                        <div
                            key={dateItem.toString()}
                            className={`cell ${!isCurrentMonth ? "disabled" : ""} ${isSelected ? "selected" : ""} ${isToday(dateItem) ? "today" : ""}`}
                            onClick={() => onDateSelect(dateItem)}
                        >
                            <span className="number">{format(dateItem, dateFormat)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
