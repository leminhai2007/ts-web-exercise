/**
 * AnimatedBackground Component
 *
 * Full-viewport background image shared by every page. The image is tiled horizontally and the
 * scene drifts left continuously, so the view travels from left to right over the background.
 * Movement is JS-driven (requestAnimationFrame) and pauses while the tab is hidden, so returning
 * to the page resumes in place with no catch-up freeze, and the offset wraps each tile width
 * seamlessly.
 *
 * Related docs (update if this component changes): docs/STYLES.md
 */

import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

const TILE_VH = 177.78; // tile width in vh: a 16:9 image scaled to 100vh tall (16 / 9 * 100)
const SPEED_VH_PER_SEC = TILE_VH / 40; // one full tile scrolls by every 40s

export const AnimatedBackground = () => {
    const stripRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let rafId = 0;
        let offsetVh = 0;
        let lastTime = 0;

        const step = (time: number) => {
            const strip = stripRef.current;
            if (!strip) return;
            const dtMs = lastTime ? time - lastTime : 0;
            lastTime = time;
            offsetVh = (offsetVh + (SPEED_VH_PER_SEC * dtMs) / 1000) % TILE_VH;
            strip.style.transform = `translateX(${-offsetVh * (window.innerHeight / 100)}px)`;
            rafId = requestAnimationFrame(step);
        };
        const start = () => {
            if (rafId) return;
            lastTime = 0;
            rafId = requestAnimationFrame(step);
        };
        const stop = () => {
            cancelAnimationFrame(rafId);
            rafId = 0;
        };
        const onVisibilityChange = () => {
            if (document.hidden) stop();
            else start();
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        start();
        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            stop();
        };
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
                ref={stripRef}
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
                    willChange: 'transform',
                }}
            />
        </Box>
    );
};
