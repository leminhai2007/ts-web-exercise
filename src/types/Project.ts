// Related docs (update if this file changes): docs/NEW_PROJECT_TEMPLATE.md (Types Convention)
import type { ComponentType } from 'react';
import type { IconProps } from '../components/AppIcons';

export interface Project {
    id: string;
    name: string;
    description: string;
    categories: string[];
    path: string;
    icon: ComponentType<IconProps>;
}
