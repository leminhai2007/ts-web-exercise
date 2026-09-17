// Related docs (update if this file changes): docs/NEW_PROJECT_TEMPLATE.md (Types Convention)
export interface WheelItem {
    id: string;
    text: string;
    color: string;
}

export interface WheelConfig {
    id: string;
    name: string;
    items: WheelItem[];
    createdAt: number;
}

export interface SavedWheel {
    id: string;
    name: string;
    items: string[];
    createdAt: number;
}

export interface SpinResult {
    item: WheelItem;
    rotation: number;
}
