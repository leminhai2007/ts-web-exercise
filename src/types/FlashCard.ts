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
