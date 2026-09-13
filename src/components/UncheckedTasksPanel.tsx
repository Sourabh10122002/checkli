import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { collectUncheckedTasks, setTaskChecked } from '../storage';
import type { UncheckedTask } from '../storage';

interface UncheckedTasksPanelProps {
    refreshSignal?: number;
    onTaskChecked: (task: UncheckedTask) => void;
}

export function UncheckedTasksPanel({ refreshSignal = 0, onTaskChecked }: UncheckedTasksPanelProps) {
    // Reads and parses every stored day, so it must not run on unrelated re-renders.
    const uncheckedTasks = useMemo(() => {
        void refreshSignal;
        return collectUncheckedTasks();
    }, [refreshSignal]);

    const handleMarkTaskChecked = (task: UncheckedTask) => {
        if (setTaskChecked(task.dateKey, task.itemId, true)) {
            onTaskChecked(task);
        }
    };

    // The list is height-capped, so tell the user which way it can still scroll.
    const listRef = useRef<HTMLUListElement>(null);
    const [scrollEdges, setScrollEdges] = useState({ above: false, below: false });

    useLayoutEffect(() => {
        // Nothing to measure when the empty state is showing; the list is unmounted
        // and its classes go with it.
        const list = listRef.current;
        if (!list) {
            return;
        }

        const update = () => {
            const overflow = list.scrollHeight - list.clientHeight;
            const above = overflow > 1 && list.scrollTop > 1;
            const below = overflow > 1 && list.scrollTop < overflow - 1;
            // Scrolling fires this continuously, so only re-render on a real change.
            setScrollEdges((previous) => (
                previous.above === above && previous.below === below
                    ? previous
                    : { above, below }
            ));
        };

        update();
        // Row heights change with wrapping, so watch the box as well as the scroll.
        const observer = new ResizeObserver(update);
        observer.observe(list);
        list.addEventListener('scroll', update, { passive: true });

        return () => {
            observer.disconnect();
            list.removeEventListener('scroll', update);
        };
    }, [uncheckedTasks]);

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
                <ul
                    ref={listRef}
                    className={[
                        'tasks-list',
                        scrollEdges.above ? 'more-above' : '',
                        scrollEdges.below ? 'more-below' : '',
                    ].filter(Boolean).join(' ')}
                >
                    {uncheckedTasks.map((task) => (
                        <li key={task.id} className="task-item">
                            <button
                                type="button"
                                className="task-check"
                                onClick={() => handleMarkTaskChecked(task)}
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
