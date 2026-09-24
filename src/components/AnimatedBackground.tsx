/**
 * AnimatedBackground Component
 *
 * Full-viewport background image shared by every page. The image slowly pans from left to right
 * and back (no vertical movement) so the scene is never static.
 *
 * Related docs (update if this component changes): docs/STYLES.md
 */

import { keyframes } from '@mui/system';
import { Box } from '@mui/material';
import backgroundImage from '../assets/background.jpg';

const panHorizontal = keyframes`
    0% {
        transform: translateX(0%);
    }
    100% {
        transform: translateX(-40vw);
    }
`;

export const AnimatedBackground = () => (
    <Box
        aria-hidden="true"
        component="div"
        sx={{
            position: 'fixed',
            inset: 0,
            zIndex: -1,
            overflow: 'hidden',
            pointerEvents: 'none',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '140vw',
                height: '100%',
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                animation: `${panHorizontal} 60s ease-in-out infinite alternate`,
            },
        }}
    />
);
