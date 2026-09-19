// Related docs (update if this file changes): docs/STYLES.md (app icon set)
// Game-style button icons built on Font Awesome Solid: bold, filled, chunky shapes
// that fit the retro theme while staying crisp. Each icon is sized in px so it works
// inside MUI buttons, icon buttons, chips and snackbars. Named exports mirror the
// identifiers used across page components so imports can be swapped 1:1.

import type { SxProps } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { Box } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { config } from '@fortawesome/fontawesome-svg-core';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
    faArrowDown,
    faArrowLeft,
    faArrowRight,
    faArrowUp,
    faArrowsRotate,
    faCalculator,
    faCloud,
    faCloudRain,
    faDatabase,
    faDharmachakra,
    faDice,
    faDownload,
    faFlag,
    faFloppyDisk,
    faFolderOpen,
    faGamepad,
    faGraduationCap,
    faHashtag,
    faHouse,
    faLanguage,
    faLayerGroup,
    faMedal,
    faPencil,
    faPen,
    faPlus,
    faShareNodes,
    faShuffle,
    faStar,
    faTrash,
    faTrophy,
    faUpload,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';

config.autoAddCss = false;

interface AppIconProps {
    icon: IconDefinition;
    fontSize?: 'small' | 'large' | 'inherit' | number;
    sx?: SxProps<Theme>;
}

export type IconProps = Omit<AppIconProps, 'icon'>;

const AppIcon = ({ icon, fontSize, sx }: AppIconProps) => {
    const hasObjectSx = typeof sx === 'object' && sx !== null && !Array.isArray(sx);
    const sxObject = hasObjectSx ? (sx as Record<string, unknown>) : {};
    const sxFontSize = typeof sxObject.fontSize === 'number' ? sxObject.fontSize : 0;
    const size = sxFontSize || (fontSize === 'small' ? 18 : fontSize === 'large' ? 32 : typeof fontSize === 'number' ? fontSize : 22);
    return (
        <Box component="span" sx={{ display: 'inline-flex', ...sxObject }}>
            <FontAwesomeIcon icon={icon} width={size} height={size} />
        </Box>
    );
};

// Arrows / navigation
const ArrowUpward = (props: IconProps) => <AppIcon icon={faArrowUp} {...props} />;
const ArrowDownward = (props: IconProps) => <AppIcon icon={faArrowDown} {...props} />;
const ArrowBack = (props: IconProps) => <AppIcon icon={faArrowLeft} {...props} />;
const ArrowForward = (props: IconProps) => <AppIcon icon={faArrowRight} {...props} />;
export const ArrowBackIcon = ArrowBack;

// Actions
const RefreshIcon = (props: IconProps) => <AppIcon icon={faArrowsRotate} {...props} />;
const AddIcon = (props: IconProps) => <AppIcon icon={faPlus} {...props} />;
const SaveIcon = (props: IconProps) => <AppIcon icon={faFloppyDisk} {...props} />;
const LoadIcon = (props: IconProps) => <AppIcon icon={faFolderOpen} {...props} />;
const DeleteIcon = (props: IconProps) => <AppIcon icon={faTrash} {...props} />;
const ShareIcon = (props: IconProps) => <AppIcon icon={faShareNodes} {...props} />;
const EditIcon = (props: IconProps) => <AppIcon icon={faPen} {...props} />;
const TrophyIcon = (props: IconProps) => <AppIcon icon={faTrophy} {...props} />;
const CloseIcon = (props: IconProps) => <AppIcon icon={faXmark} {...props} />;

// Export / import / install
const DownloadIcon = (props: IconProps) => <AppIcon icon={faDownload} {...props} />;
const UploadIcon = (props: IconProps) => <AppIcon icon={faUpload} {...props} />;

// Games / random
const ShuffleIcon = (props: IconProps) => <AppIcon icon={faShuffle} {...props} />;
const RandomIcon = (props: IconProps) => <AppIcon icon={faDice} {...props} />;
const WheelIcon = (props: IconProps) => <AppIcon icon={faDharmachakra} {...props} />;
const GameIcon = (props: IconProps) => <AppIcon icon={faGamepad} {...props} />;

// Media / status
const CloudIcon = (props: IconProps) => <AppIcon icon={faCloud} {...props} />;
const CloudOffIcon = (props: IconProps) => <AppIcon icon={faCloudRain} {...props} />;

// Objects / UI
const StarIcon = (props: IconProps) => <AppIcon icon={faStar} {...props} />;
const StarBorderIcon = (props: IconProps) => <AppIcon icon={faStarRegular} {...props} />;
const HomeIcon = (props: IconProps) => <AppIcon icon={faHouse} {...props} />;
const SchoolIcon = (props: IconProps) => <AppIcon icon={faGraduationCap} {...props} />;
const CollectionsIcon = (props: IconProps) => <AppIcon icon={faLayerGroup} {...props} />;
const SudokuIcon = (props: IconProps) => <AppIcon icon={faHashtag} {...props} />;
const DataManagerIcon = (props: IconProps) => <AppIcon icon={faDatabase} {...props} />;
const LanguageIcon = (props: IconProps) => <AppIcon icon={faLanguage} {...props} />;

// Sudoku modes
const NoteIcon = (props: IconProps) => <AppIcon icon={faPencil} {...props} />;
const NumberIcon = (props: IconProps) => <AppIcon icon={faCalculator} {...props} />;

// Habit Tracker
export const MedalIcon = (props: IconProps) => <AppIcon icon={faMedal} {...props} />;

// Aliases matching each page's imported identifiers (swapped from @mui/icons-material 1:1)
export const NewGameIcon = (props: IconProps) => <AppIcon icon={faPlus} {...props} />;
export const ResetIcon = (props: IconProps) => <AppIcon icon={faArrowsRotate} {...props} />;
export const FolderIcon = (props: IconProps) => <AppIcon icon={faFolderOpen} {...props} />;
export const SuicideIcon = (props: IconProps) => <AppIcon icon={faFlag} {...props} />;
export const GetAppIcon = (props: IconProps) => <AppIcon icon={faDownload} {...props} />;
export const ExportIcon = (props: IconProps) => <AppIcon icon={faDownload} {...props} />;
export const ImportIcon = (props: IconProps) => <AppIcon icon={faUpload} {...props} />;

export {
    ArrowUpward,
    ArrowDownward,
    ArrowBack,
    ArrowForward,
    RefreshIcon,
    AddIcon,
    SaveIcon,
    LoadIcon,
    DeleteIcon,
    ShareIcon,
    EditIcon,
    TrophyIcon,
    CloseIcon,
    DownloadIcon,
    UploadIcon,
    ShuffleIcon,
    RandomIcon,
    WheelIcon,
    GameIcon,
    CloudIcon,
    CloudOffIcon,
    StarIcon,
    StarBorderIcon,
    HomeIcon,
    SchoolIcon,
    CollectionsIcon,
    SudokuIcon,
    DataManagerIcon,
    LanguageIcon,
    NoteIcon,
    NumberIcon,
};
