export interface ChecklistItem {
    id: string;
    text: string;
    imageBase64?: string;
    isChecked: boolean;
}

export interface Checklist {
    id: string;
    title: string;
    items: ChecklistItem[];
}
