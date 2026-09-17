// Related docs (update if this file changes): docs/NEW_PROJECT_TEMPLATE.md (Types Convention)
export interface Project {
    id: string;
    name: string;
    description: string;
    categories: string[];
    path: string;
    thumbnail?: string;
}
