import type { ChecklistItem } from './types';

const TITLE_PREFIX = 'checkli_title_';
const ITEMS_PREFIX = 'checkli_items_';
const IMAGES_PREFIX = 'checkli_images_';
const SCHEMA_KEY = 'checkli_schema_version';
const SCHEMA_VERSION = '2';

/**
 * How an item is persisted. Pasted images are deliberately kept out of this shape:
 * a base64 data URL is orders of magnitude larger than the rest of an item, and the
 * unchecked-task scan below reads every stored day on each refresh.
 */
type StoredItem = Pick<ChecklistItem, 'id' | 'text' | 'isChecked'>;
type StoredImages = Record<string, string>;

export interface StoredChecklist {
    title: string;
    items: ChecklistItem[];
}

export interface UncheckedTask {
    id: string;
    itemId: string;
    text: string;
    dateKey: string;
    title: string;
}

/** localStorage throws on quota overflow, and on access itself in some privacy modes. */
function readKey(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        console.error(`Checkli: could not read "${key}" from localStorage.`, error);
        return null;
    }
}

function writeKey(key: string, value: string): boolean {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.error(`Checkli: could not write "${key}" to localStorage.`, error);
        return false;
    }
}

function removeKey(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Checkli: could not remove "${key}" from localStorage.`, error);
    }
}

function parseJson<T>(raw: string | null, fallback: T): T {
    if (!raw) {
        return fallback;
    }

    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function createEmptyItem(): ChecklistItem {
    return { id: crypto.randomUUID(), text: '', isChecked: false };
}

function listDateKeys(): string[] {
    const dateKeys: string[] = [];

    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(ITEMS_PREFIX)) {
                dateKeys.push(key.slice(ITEMS_PREFIX.length));
            }
        }
    } catch (error) {
        console.error('Checkli: could not enumerate localStorage.', error);
    }

    return dateKeys;
}

export function loadChecklist(dateKey: string): StoredChecklist {
    const title = readKey(TITLE_PREFIX + dateKey) ?? '';
    const rawItems = readKey(ITEMS_PREFIX + dateKey);

    if (!rawItems) {
        return { title, items: [createEmptyItem()] };
    }

    const storedItems = parseJson<StoredItem[]>(rawItems, []);
    const images = parseJson<StoredImages>(readKey(IMAGES_PREFIX + dateKey), {});

    return {
        title,
        items: storedItems.map((item) => (
            images[item.id] ? { ...item, imageBase64: images[item.id] } : item
        )),
    };
}

export function saveTitle(dateKey: string, title: string): boolean {
    if (!title) {
        removeKey(TITLE_PREFIX + dateKey);
        return true;
    }

    return writeKey(TITLE_PREFIX + dateKey, title);
}

export function saveItems(dateKey: string, items: ChecklistItem[]): boolean {
    const storedItems: StoredItem[] = items.map(({ id, text, isChecked }) => ({ id, text, isChecked }));
    return writeKey(ITEMS_PREFIX + dateKey, JSON.stringify(storedItems));
}

export function saveImages(dateKey: string, items: ChecklistItem[]): boolean {
    const images: StoredImages = {};
    let hasImages = false;

    for (const item of items) {
        if (item.imageBase64) {
            images[item.id] = item.imageBase64;
            hasImages = true;
        }
    }

    if (!hasImages) {
        removeKey(IMAGES_PREFIX + dateKey);
        return true;
    }

    return writeKey(IMAGES_PREFIX + dateKey, JSON.stringify(images));
}

export function collectUncheckedTasks(): UncheckedTask[] {
    const tasks: UncheckedTask[] = [];

    for (const dateKey of listDateKeys()) {
        const storedItems = parseJson<StoredItem[]>(readKey(ITEMS_PREFIX + dateKey), []);
        const title = (readKey(TITLE_PREFIX + dateKey) ?? '').trim();

        for (const item of storedItems) {
            if (!item.isChecked && item.text.trim()) {
                tasks.push({
                    id: `${dateKey}-${item.id}`,
                    itemId: item.id,
                    text: item.text.trim(),
                    dateKey,
                    title,
                });
            }
        }
    }

    tasks.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    return tasks;
}

/** Returns true when the item existed and was flipped from unchecked to checked. */
export function markTaskChecked(dateKey: string, itemId: string): boolean {
    const rawItems = readKey(ITEMS_PREFIX + dateKey);
    if (!rawItems) {
        return false;
    }

    let hasUpdated = false;
    const updatedItems = parseJson<StoredItem[]>(rawItems, []).map((item) => {
        if (item.id === itemId && !item.isChecked) {
            hasUpdated = true;
            return { ...item, isChecked: true };
        }

        return item;
    });

    if (!hasUpdated) {
        return false;
    }

    return writeKey(ITEMS_PREFIX + dateKey, JSON.stringify(updatedItems));
}

/**
 * Earlier versions inlined base64 images into the items key, which made every read of
 * a day's tasks pull megabytes of image data into memory. Move them out once on boot.
 */
export function migrateInlineImages(): void {
    if (readKey(SCHEMA_KEY) === SCHEMA_VERSION) {
        return;
    }

    for (const dateKey of listDateKeys()) {
        const rawItems = readKey(ITEMS_PREFIX + dateKey);
        if (!rawItems?.includes('"imageBase64"')) {
            continue;
        }

        const legacyItems = parseJson<ChecklistItem[]>(rawItems, []);
        // Write the images out first: if that fails there is nothing to lose by
        // leaving the legacy key intact for the next attempt.
        if (saveImages(dateKey, legacyItems)) {
            saveItems(dateKey, legacyItems);
        }
    }

    writeKey(SCHEMA_KEY, SCHEMA_VERSION);
}
