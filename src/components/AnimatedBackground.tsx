/**
 * AnimatedBackground Component
 *
 * Full-viewport background image shared by every page. The image is tiled horizontally and the
 * scene drifts left continuously, so the view travels from left to right over the background.
 * The drift is a pure CSS `transform` keyframe animation, so the browser composites it entirely on
 * the GPU/compositor thread and the main thread stays free (this matters on pages that animate
 * their own content, e.g. the Lucky Wheel spin). The animation is paused while the tab is hidden,
 * so returning to the page resumes in place with no catch-up freeze, and the loop is
 * pixel-identical (seamless) because it steps exactly one tile width.
 *
 * Related docs (update if this component changes): docs/STYLES.md
 */

import { useEffect, useState } from 'react';
import { Box, keyframes } from '@mui/material';

const TILE_VH = 177.78; // tile width in vh: a 16:9 image scaled to 100vh tall (16 / 9 * 100)
const DRIFT_SECONDS = 40; // one full tile scrolls by every 40s

const driftLeft = keyframes`
    from { transform: translate3d(0, 0, 0); }
    to { transform: translate3d(-${TILE_VH}vh, 0, 0); }
`;

export const AnimatedBackground = () => {
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        const onVisibilityChange = () => setPaused(document.hidden);
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, []);

    return (
        <Box
            aria-hidden="true"
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: -1,
                overflow: 'hidden',
                pointerEvents: 'none',
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 'calc(100vw + 180vh)',
                    height: '100vh',
                    backgroundImage: 'url(/background.jpg)',
                    backgroundSize: 'auto 100vh',
                    backgroundPosition: 'left center',
                    backgroundRepeat: 'repeat-x',
                    animation: `${driftLeft} ${DRIFT_SECONDS}s linear infinite`,
                    animationPlayState: paused ? 'paused' : 'running',
                    willChange: 'transform',
                }}
            />
        </Box>
    );
};
