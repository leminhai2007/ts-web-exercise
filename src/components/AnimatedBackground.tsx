/**
 * AnimatedBackground Component
 *
 * Full-viewport background image shared by every page. The image fills the whole screen at any
 * size/aspect (background-size: cover crops edges, never letterboxes) and slowly pans from left to
 * right and back (no vertical movement) so the scene is never static.
 *
 * Related docs (update if this component changes): docs/STYLES.md
 */

import { keyframes } from '@mui/system';
import { Box } from '@mui/material';

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
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -1,
            overflow: 'hidden',
            pointerEvents: 'none',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '140vw',
                minWidth: '100vw',
                height: '100vh',
                backgroundImage: 'url(/background.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: '50% 50%',
                backgroundRepeat: 'no-repeat',
                willChange: 'transform',
                animation: `${panHorizontal} 60s ease-in-out infinite alternate`,
            },
        }}
    />
);
