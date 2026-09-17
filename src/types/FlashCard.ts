// Related docs (update if this file changes): docs/NEW_PROJECT_TEMPLATE.md (Types Convention)
export interface FlashCard {
    id: string;
    label: string;
    content: string;
}

export interface FlashCardCollection {
    id: string;
    name: string;
    cards: FlashCard[];
    createdAt: number;
    updatedAt: number;
}
