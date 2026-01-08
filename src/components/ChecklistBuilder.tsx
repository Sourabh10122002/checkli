import { useState, useRef, useEffect } from 'react';
import type { ChecklistItem } from '../types';
import { format } from 'date-fns';

interface ChecklistBuilderProps {
    selectedDate: Date;
}

export function ChecklistBuilder({ selectedDate }: ChecklistBuilderProps) {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');

    // Initialize with function to prevent unnecessary localStorage reads on every render, but simplistic here since we use useEffect for updates
    const [title, setTitle] = useState('');
    const [items, setItems] = useState<ChecklistItem[]>([]);

    // Flag to skip initial save when state is updated from storage
    const isInitialLoad = useRef(true);

    const newItemInputRef = useRef<HTMLInputElement>(null);

    // Load data when dateKey changes
    useEffect(() => {
        isInitialLoad.current = true;
        const savedTitle = localStorage.getItem(`checkli_title_${dateKey}`);
        const savedItems = localStorage.getItem(`checkli_items_${dateKey}`);

        setTitle(savedTitle || '');
        setItems(savedItems ? JSON.parse(savedItems) : [{ id: '1', text: '', isChecked: false }]);
        // Small timeout to allow state to settle before enabling save
        setTimeout(() => { isInitialLoad.current = false; }, 50);
    }, [dateKey]);

    useEffect(() => {
        if (!isInitialLoad.current) {
            localStorage.setItem(`checkli_title_${dateKey}`, title);
        }
    }, [title, dateKey]);

    useEffect(() => {
        if (!isInitialLoad.current) {
            localStorage.setItem(`checkli_items_${dateKey}`, JSON.stringify(items));
        }
    }, [items, dateKey]);

    // Focus the last empty item's input if it was just added
    useEffect(() => {
        if (!isInitialLoad.current && items.length > 0 && items[items.length - 1].text === '') {
            newItemInputRef.current?.focus();
        }
    }, [items.length]);

    const handleAddItem = () => {
        const newItem: ChecklistItem = {
            id: crypto.randomUUID(),
            text: '',
            isChecked: false
        };
        setItems([...items, newItem]);
    };

    const handleUpdateItem = (id: string, text: string) => {
        setItems(items.map(item => item.id === id ? { ...item, text } : item));
    };

    const handleToggleItem = (id: string) => {
        setItems(items.map(item => item.id === id ? { ...item, isChecked: !item.isChecked } : item));
    };

    const handleDeleteItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddItem();
        }
        if (e.key === 'Backspace' && (e.currentTarget as HTMLInputElement).value === '' && items.length > 1) {
            handleDeleteItem(id);
        }
    };

    return (
        <div className="checklist-builder">
            <div className="checklist-date-label" style={{ marginBottom: '1rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                {format(selectedDate, 'EEEE, MMMM do, yyyy')}
            </div>
            <input
                type="text"
                className="checklist-title-input"
                placeholder="Checklist Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <div className="checklist-items">
                {items.map((item, index) => (
                    <div key={item.id} className={`checklist-item ${item.isChecked ? 'checked' : ''}`}>
                        <label className="checkbox-container">
                            <input
                                type="checkbox"
                                checked={item.isChecked}
                                onChange={() => handleToggleItem(item.id)}
                            />
                            <span className="checkmark"></span>
                        </label>
                        <input
                            ref={index === items.length - 1 ? newItemInputRef : null}
                            type="text"
                            className="item-input"
                            placeholder="Next item..."
                            value={item.text}
                            onChange={(e) => handleUpdateItem(item.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, item.id)}
                        />
                        <button
                            className="delete-btn"
                            onClick={() => handleDeleteItem(item.id)}
                            aria-label="Delete item"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            <button className="add-item-btn" onClick={handleAddItem}>
                + Add item
            </button>
        </div>
    );
}
