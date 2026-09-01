import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ChecklistItem } from '../types';
import { format } from 'date-fns';
import { loadChecklist, saveImages, saveItems, saveTitle } from '../storage';

interface ChecklistBuilderProps {
    selectedDate: Date;
    refreshSignal?: number;
    onDataChange?: () => void;
}

const STORAGE_ERROR_MESSAGE =
    'Changes could not be saved — browser storage is full. Remove a pasted image or clear an old checklist.';

type AutoGrowTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string };

/**
 * Owns its own ref so the height fix-up runs once per value change. An inline `ref`
 * callback on the textarea would be a new function on every render, forcing React to
 * detach and re-attach the node — and a synchronous reflow — on each one.
 */
function AutoGrowTextarea({ value, ...props }: AutoGrowTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) {
            return;
        }

        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }, [value]);

    return <textarea {...props} ref={textareaRef} value={value} />;
}

export function ChecklistBuilder({ selectedDate, refreshSignal = 0, onDataChange }: ChecklistBuilderProps) {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const loadToken = `${dateKey}:${refreshSignal}`;

    const [checklist, setChecklist] = useState(() => loadChecklist(dateKey));
    const [loadedToken, setLoadedToken] = useState(loadToken);
    const [focusItemId, setFocusItemId] = useState<string | null>(null);
    const [hasStorageError, setHasStorageError] = useState(false);

    // Re-read storage during render rather than in an effect. An effect would leave one
    // commit where the new dateKey is paired with the previous day's state, which the
    // save path would then persist under the wrong key.
    if (loadedToken !== loadToken) {
        setLoadedToken(loadToken);
        setChecklist(loadChecklist(dateKey));
        setFocusItemId(null);
        setHasStorageError(false);
    }

    const { title, items } = checklist;

    // Mirrors the committed state so deferred callbacks (the FileReader below) and two
    // changes within one event both read the latest items.
    const checklistRef = useRef(checklist);
    useEffect(() => {
        checklistRef.current = checklist;
    }, [checklist]);

    const changeTitle = (nextTitle: string) => {
        const next = { ...checklistRef.current, title: nextTitle };
        checklistRef.current = next;
        setChecklist(next);
        setHasStorageError(!saveTitle(dateKey, nextTitle));
        onDataChange?.();
    };

    const changeItems = (
        updater: (previousItems: ChecklistItem[]) => ChecklistItem[],
        imagesChanged = false
    ) => {
        const nextItems = updater(checklistRef.current.items);
        const next = { ...checklistRef.current, items: nextItems };
        checklistRef.current = next;
        setChecklist(next);

        // Text and checked state are rewritten on every edit; the far larger image
        // payload is only rewritten when an image was actually added or removed.
        const savedItems = saveItems(dateKey, nextItems);
        const savedImages = imagesChanged ? saveImages(dateKey, nextItems) : true;
        setHasStorageError(!savedItems || !savedImages);
        onDataChange?.();
    };

    const handleAddItem = () => {
        const newItem: ChecklistItem = {
            id: crypto.randomUUID(),
            text: '',
            isChecked: false
        };

        setFocusItemId(newItem.id);
        changeItems((previousItems) => [...previousItems, newItem]);
    };

    const handleUpdateItem = (id: string, text: string) => {
        changeItems((previousItems) => previousItems.map(item => item.id === id ? { ...item, text } : item));
    };

    const handleToggleItem = (id: string) => {
        changeItems((previousItems) => previousItems.map(item => item.id === id ? { ...item, isChecked: !item.isChecked } : item));
    };

    const handleDeleteItem = (id: string) => {
        changeItems((previousItems) => previousItems.filter(item => item.id !== id), true);
    };

    const handleRemoveImage = (id: string) => {
        changeItems((previousItems) => previousItems.map(item => item.id === id ? { ...item, imageBase64: undefined } : item), true);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, id: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddItem();
        }
        if (e.key === 'Backspace' && e.currentTarget.value === '' && items.length > 1) {
            handleDeleteItem(id);
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>, id: string) => {
        const clipboardItems = e.clipboardData.items;

        for (let i = 0; i < clipboardItems.length; i++) {
            if (clipboardItems[i].type.indexOf("image") === -1) {
                continue;
            }

            e.preventDefault();
            const blob = clipboardItems[i].getAsFile();
            if (!blob) {
                break;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result;
                // The item can be gone by now — deleted, or the user moved to another day.
                if (typeof base64 !== 'string' || !checklistRef.current.items.some(item => item.id === id)) {
                    return;
                }

                changeItems(
                    (previousItems) => previousItems.map(item => item.id === id ? { ...item, imageBase64: base64 } : item),
                    true
                );
            };
            reader.readAsDataURL(blob);
            break;
        }
    };

    return (
        <div className="checklist-builder">
            <div className="checklist-date-label" style={{ marginBottom: '1rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                {format(selectedDate, 'EEEE, MMMM do, yyyy')}
            </div>
            {hasStorageError && (
                <p className="storage-error" role="alert">{STORAGE_ERROR_MESSAGE}</p>
            )}
            <input
                type="text"
                className="checklist-title-input"
                placeholder="Checklist Title"
                value={title}
                onChange={(e) => changeTitle(e.target.value)}
            />

            <div className="checklist-items">
                {items.map((item) => (
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
                            <AutoGrowTextarea
                                className="item-input"
                                placeholder="Next item..."
                                value={item.text}
                                rows={1}
                                autoFocus={item.id === focusItemId}
                                onChange={(e) => handleUpdateItem(item.id, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, item.id)}
                                onPaste={(e) => handlePaste(e, item.id)}
                            />
                            {item.imageBase64 && (
                                <div className="item-image-container">
                                    <img src={item.imageBase64} alt="Attached" className="item-attached-image" />
                                    <button
                                        className="remove-image-btn"
                                        onClick={() => handleRemoveImage(item.id)}
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
