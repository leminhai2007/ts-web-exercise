// Related docs (update if this file changes): docs/NEW_PROJECT_TEMPLATE.md (Types Convention)

/** Marker that identifies files produced/consumed by the Data Manager page. */
export const BACKUP_FORMAT = 'ts-web-exercise-data-backup';

/** Bump when the on-disk backup structure changes incompatibly. */
export const BACKUP_VERSION = 1;

/** Where a backup file was exported from (used to detect domain moves). */
export interface BackupOrigin {
    /** Full origin, e.g. https://example.com */
    origin: string;
    /** Hostname only, e.g. example.com */
    domain: string;
    /** Pathname of the exporter, e.g. / */
    pathname: string;
}

/** One project's exported data: localStorage key -> parsed JSON value. */
export interface BackupProject {
    [storageKey: string]: unknown;
}

/** Top-level structure of a Data Manager backup file. */
export interface BackupFile {
    format: string;
    version: number;
    exportedAt: number;
    origin: BackupOrigin;
    projects: Record<string, BackupProject>;
}
