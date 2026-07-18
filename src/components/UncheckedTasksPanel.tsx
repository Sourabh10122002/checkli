import type { ChecklistItem } from '../types';
import { format, isValid, parseISO } from 'date-fns';

interface UncheckedTasksPanelProps {
    refreshSignal?: number;
    onTaskChecked: () => void;
}

export function UncheckedTasksPanel({ refreshSignal = 0, onTaskChecked }: UncheckedTasksPanelProps) {
    void refreshSignal;

    const uncheckedTasks = (() => {
        const tasks: Array<{ id: string; itemId: string; text: string; dateKey: string; title: string }> = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith('checkli_items_')) {
                continue;
            }

            const taskDateKey = key.replace('checkli_items_', '');
            const rawItems = localStorage.getItem(key);
            if (!rawItems) {
                continue;
            }

            try {
                const parsedItems = JSON.parse(rawItems) as ChecklistItem[];
                const checklistTitle = localStorage.getItem(`checkli_title_${taskDateKey}`) || '';

                parsedItems.forEach((item) => {
                    if (!item.isChecked && item.text.trim()) {
                        tasks.push({
                            id: `${taskDateKey}-${item.id}`,
                            itemId: item.id,
                            text: item.text.trim(),
                            dateKey: taskDateKey,
                            title: checklistTitle.trim(),
                        });
                    }
                });
            } catch {
                continue;
            }
        }

        tasks.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
        return tasks;
    })();

    const handleMarkTaskChecked = (taskDateKey: string, itemId: string) => {
        const storageKey = `checkli_items_${taskDateKey}`;
        const rawItems = localStorage.getItem(storageKey);
        if (!rawItems) {
            return;
        }

        try {
            let hasUpdated = false;
            const parsedItems = JSON.parse(rawItems) as ChecklistItem[];
            const updatedItems = parsedItems.map((item) => {
                if (item.id === itemId && !item.isChecked) {
                    hasUpdated = true;
                    return { ...item, isChecked: true };
                }

                return item;
            });

            if (!hasUpdated) {
                return;
            }

            localStorage.setItem(storageKey, JSON.stringify(updatedItems));
            onTaskChecked();
        } catch {
            return;
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
