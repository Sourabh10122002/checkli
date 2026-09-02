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
        return isValid(parsedDate) ? format(parsedDate, 'MMMM do, yyyy') : taskDateKey;
    };

    return (
        <div className="unchecked-tasks-section">
            <h3>All unchecked tasks</h3>
            {uncheckedTasks.length === 0 ? (
                <p>No unchecked tasks yet.</p>
            ) : (
                <ul className="unchecked-tasks-list">
                    {uncheckedTasks.map((task) => (
                        <li key={task.id} className="unchecked-task-item">
                            <div className="unchecked-task-date">{formatTaskDate(task.dateKey)}</div>
                            <div className="unchecked-task-text">{task.text}</div>
                            {task.title && (
                                <div className="unchecked-task-title">{task.title}</div>
                            )}
                            <button
                                className="unchecked-task-action"
                                onClick={() => handleMarkTaskChecked(task.dateKey, task.itemId)}
                            >
                                Mark as checked
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
