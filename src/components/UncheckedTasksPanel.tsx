import { useMemo } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { collectUncheckedTasks, markTaskChecked } from '../storage';

interface UncheckedTasksPanelProps {
    refreshSignal?: number;
    onTaskChecked: () => void;
}

export function UncheckedTasksPanel({ refreshSignal = 0, onTaskChecked }: UncheckedTasksPanelProps) {
    // Reads and parses every stored day, so it must not run on unrelated re-renders.
    const uncheckedTasks = useMemo(() => {
        void refreshSignal;
        return collectUncheckedTasks();
    }, [refreshSignal]);

    const handleMarkTaskChecked = (taskDateKey: string, itemId: string) => {
        if (markTaskChecked(taskDateKey, itemId)) {
            onTaskChecked();
        }
    };

    const formatTaskDate = (taskDateKey: string) => {
        const parsedDate = parseISO(taskDateKey);
        return isValid(parsedDate) ? format(parsedDate, 'MMM d, yyyy') : taskDateKey;
    };

    return (
        <section className="tasks-panel panel" aria-labelledby="unchecked-heading">
            <div className="panel-head">
                <h2 id="unchecked-heading">Still open</h2>
                {uncheckedTasks.length > 0 && (
                    <span className="panel-badge">{uncheckedTasks.length}</span>
                )}
            </div>

            {uncheckedTasks.length === 0 ? (
                <div className="empty-state">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <p>Nothing outstanding. Unchecked items from any day will collect here.</p>
                </div>
            ) : (
                <ul className="tasks-list">
                    {uncheckedTasks.map((task) => (
                        <li key={task.id} className="task-item">
                            <button
                                type="button"
                                className="task-check"
                                onClick={() => handleMarkTaskChecked(task.dateKey, task.itemId)}
                                aria-label={`Mark "${task.text}" as checked`}
                                title="Mark as checked"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </button>
                            <div className="task-main">
                                <p className="task-text">{task.text}</p>
                                <p className="task-meta">
                                    <span className="task-date">{formatTaskDate(task.dateKey)}</span>
                                    {task.title && (
                                        <>
                                            <span className="task-sep" aria-hidden="true">·</span>
                                            <span className="task-title">{task.title}</span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
