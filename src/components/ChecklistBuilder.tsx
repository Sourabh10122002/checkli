import { useState, useRef, useEffect } from 'react';
import type { ChecklistItem } from '../types';
import { format } from 'date-fns';

interface ChecklistBuilderProps {
    selectedDate: Date;
    refreshSignal?: number;
    onDataChange?: () => void;
}

export function ChecklistBuilder({ selectedDate, refreshSignal = 0, onDataChange }: ChecklistBuilderProps) {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');

    // Initialize with function to prevent unnecessary localStorage reads on every render, but simplistic here since we use useEffect for updates
    const [title, setTitle] = useState('');
    const [items, setItems] = useState<ChecklistItem[]>([]);

    // Flag to skip initial save when state is updated from storage
    const isInitialLoad = useRef(true);

    const newItemInputRef = useRef<HTMLTextAreaElement>(null);

    // Load data when dateKey changes
    useEffect(() => {
        isInitialLoad.current = true;
        const savedTitle = localStorage.getItem(`checkli_title_${dateKey}`);
        const savedItems = localStorage.getItem(`checkli_items_${dateKey}`);

        setTitle(savedTitle || '');
        setItems(savedItems ? JSON.parse(savedItems) : [{ id: '1', text: '', isChecked: false }]);
        // Small timeout to allow state to settle before enabling save
        setTimeout(() => { isInitialLoad.current = false; }, 50);
    }, [dateKey, refreshSignal]);

    useEffect(() => {
        if (!isInitialLoad.current) {
            localStorage.setItem(`checkli_title_${dateKey}`, title);
            onDataChange?.();
        }
    }, [title, dateKey, onDataChange]);

    useEffect(() => {
        if (!isInitialLoad.current) {
            localStorage.setItem(`checkli_items_${dateKey}`, JSON.stringify(items));
            onDataChange?.();
        }
    }, [items, dateKey, onDataChange]);

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
        if (e.key === 'Backspace' && (e.currentTarget as HTMLTextAreaElement).value === '' && items.length > 1) {
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
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <textarea
                                ref={index === items.length - 1 ? (el) => {
                                    newItemInputRef.current = el;
                                    if (el) {
                                        el.style.height = 'auto';
                                        el.style.height = el.scrollHeight + 'px';
                                    }
                                } : (el) => {
                                    if (el) {
                                        el.style.height = 'auto';
                                        el.style.height = el.scrollHeight + 'px';
                                    }
                                }}
                                className="item-input"
                                placeholder="Next item..."
                                value={item.text}
                                rows={1}
                                onChange={(e) => {
                                    handleUpdateItem(item.id, e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                onKeyDown={(e) => handleKeyDown(e, item.id)}
                                onPaste={(e) => {
                                    const items = e.clipboardData.items;
                                    for (let i = 0; i < items.length; i++) {
                                        if (items[i].type.indexOf("image") !== -1) {
                                            e.preventDefault();
                                            const blob = items[i].getAsFile();
                                            if (blob) {
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    const base64 = event.target?.result as string;
                                                    setItems(prevItems => prevItems.map(it => it.id === item.id ? { ...it, imageBase64: base64 } : it));
                                                };
                                                reader.readAsDataURL(blob);
                                            }
                                            break;
                                        }
                                    }
                                }}
                            />
                            {item.imageBase64 && (
                                <div className="item-image-container">
                                    <img src={item.imageBase64} alt="Attached" className="item-attached-image" />
                                    <button
                                        className="remove-image-btn"
                                        onClick={() => setItems(items.map(it => it.id === item.id ? { ...it, imageBase64: undefined } : it))}
                                        title="Remove image"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                        </div>
                        <button
                            className="delete-btn"
                            onClick={() => handleDeleteItem(item.id)}
                            aria-label="Delete item"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
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
