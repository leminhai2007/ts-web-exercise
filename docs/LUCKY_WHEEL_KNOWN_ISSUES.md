# Lucky Wheel - Performance Notes & Known Issues

## Resolved: whole page stalled while spinning a large wheel

### Symptom

Spinning a wheel with many items (reported with 64) made the **entire page** stutter — the
animated background visibly froze and the wheel animation was choppy. The freeze was not limited
to the wheel; everything on screen dropped frames.

### Root cause

The old implementation redrew the whole wheel from scratch on **every animation frame** and drove
that redraw with React state:

1. `requestAnimationFrame` called `setRotation(...)` ~60 times/second.
2. Each state update re-rendered `LuckyWheel` **and its whole MUI subtree** (sticky `AppBar`,
   toolbar, 6 action buttons, the `Paper` wrapping the wheel).
3. `drawWheel` was a `useCallback` depending on `rotation`, so **two** effects both fired every
   frame and each performed a full `clearRect` + N slice fills + N `fillText` (with a
   `shadowBlur` pass per label).
4. The label-fitting loop called `measureText` once per character per slice per frame — for a
   64-item wheel that is thousands of text measurements per frame, recomputing values that do not
   depend on rotation at all.
5. The rotating canvas was wrapped in a `Paper` with `backdrop-filter: blur(10px)`, directly above
   the always-animating `AnimatedBackground`. The browser had to re-snapshot and re-blur the
   moving backdrop on every frame.
6. The canvas also carried a CSS `filter: drop-shadow(...)`, which is re-rasterized whenever the
   element is transformed.
7. `AnimatedBackground` ran its own `requestAnimationFrame` loop, competing for the main thread.

Steps 1-4 put the whole thing on the main thread; steps 5-6 made every frame expensive to
composite on top of that. `main.tsx` renders under `<StrictMode>`, which additionally double-
invoked the effects in development.

### Fix

| Area              | Change                                                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rendering         | The wheel is rasterized **once per configuration change** into two stacked canvases: a rotating layer (slices + labels) and a static layer (rim + hub + pointer). |
| Rotation          | Rotation is a CSS `transform: rotate()` on the rotating layer with `will-change: transform`, so the browser composites it and never repaints pixels.              |
| Spin loop         | Writes `canvas.style.transform` directly. No `setState` per frame, so the component does not re-render while spinning.                                            |
| Duplicate effects | The two redraw effects were merged into one keyed on `[items, canvasSize, theme color, wheelFontReady]`.                                                          |
| Label fitting     | Replaced the per-character `measureText` loop with a binary search (`fitSliceText`) — O(log n) measurements instead of O(n).                                      |
| Crispness         | Backing stores are sized to `canvasSize * devicePixelRatio` (capped at 2) and the contexts are pre-scaled, so labels stay sharp without extra redraws.            |
| Filters           | Removed `backdrop-filter: blur(10px)` from the wheel's `Paper` and the CSS `drop-shadow` from the canvas.                                                         |
| Background        | `AnimatedBackground` now drifts with a pure CSS `@keyframes` animation, so it runs entirely on the compositor.                                                    |
| Cleanup           | The spin frame id is tracked in a ref and cancelled on unmount, so navigating away mid-spin no longer leaves a loop running.                                      |

The wheel is a focusable `role="button"`; Enter/Space spin it.

### Measured result

64 items, ~4.6s spin, headless Chromium at 1280x800 and 375x667:

| Metric                   | Before    | After    |
| ------------------------ | --------- | -------- |
| Frames delivered         | 47        | 271      |
| Average frame time       | 97.89 ms  | 16.99 ms |
| Median frame time        | 33.30 ms  | 16.70 ms |
| p95 frame time           | 316.70 ms | 16.90 ms |
| Worst frame              | 349.90 ms | 66.70 ms |
| Frames slower than 33 ms | 26 of 47  | 2 of 271 |
| Canvas repaints per spin | ~480      | 0        |
| React renders per spin   | ~240      | 2        |

The winner calculation is unchanged (`(270 - rotation) / sliceAngle`) and was verified against the
rendered rotation over 10 consecutive spins.

## Resolved: slice labels became washed out / nearly transparent

### Symptom

After the two-canvas rewrite, slice labels read as thin and semi-transparent, especially on a
HiDPI display. Reported as "nearly transparent and hard to see".

### Root cause

Two separate problems, both invisible in the source at first glance:

1. **`ctx.shadowBlur` is the one length that ignores the context transform.** Every other canvas
   length is expressed in user-space units and therefore scales with the transform matrix, but
   `shadowBlur` is defined in _device_ pixels. The rewrite pre-scales the context by
   `devicePixelRatio` to keep the wheel crisp, so a hardcoded `shadowBlur` ends up at `1 / dpr` of
   its intended strength: identical code, half the halo on a 2x screen, a third of it on a 3x one.
2. **Dense wheels have overlapping labels, independent of any shadow.** The labels are drawn
   radially, so the room one label actually has is the arc length it covers at the label radius
   (`sliceAngle * labelRadius`). A 64 item wheel leaves ~11px of arc per label, which cannot hold
   16px text, so neighbours bled into each other.

Measured darkness of the label band (darkest pixel found in the band, 0 = black, 255 = white):

| Backing store     | Darkest pixel in label band                                 |
| ----------------- | ----------------------------------------------------------- |
| Before fix, dpr=1 | 64 (barely darker than the 78-luminance slice fill)         |
| Before fix, dpr=2 | washed out - 5.0% dark pixels, mean neighbour luminance 227 |
| After fix, dpr=1  | 2, with a white core at 253                                 |
| After fix, dpr=2  | 1, with a white core at 255                                 |

Note the "before" rows: the pre-rewrite code was not HiDPI aware at all - it kept a fixed 450x450
backing store and let the browser upscale it, so the original text was also merely blurry rather
than crisp.

### Fix

1. Multiply the halo by `dpr` at draw time (`LABEL_SHADOW_BLUR * scale * dpr`) and **comment it**,
   because the value looks redundant in the source and the next reader will "clean it up" and
   reintroduce the bug.
2. Stop relying on the shadow alone: draw a hard dark `strokeText` outline with a **transformed**
   `lineWidth` underneath the white `fillText`. `lineWidth` scales correctly, so the outline stays
   crisp and device independent, and it carries legibility even if the halo is ever mis-scaled.
3. Scale both the outline width and the halo with the font size, and shrink the font as the wheel
   gets denser (`LABEL_PITCH_FILL`, the fraction of the available arc one label may occupy). Fonts
   only shrink past ~36 items, so the common cases are pixel-identical to before.
4. Move the shadow state **inside** the per-label `save()` / `restore()` and set it after the slice
   fills. Previously it was set before the loop, so every flat slice fill inherited a drop shadow
   and each slice got a visible dark ring.

Verified by scanning the label band for labels that cross their own slice boundary:

| 64 items      | Slices whose label bleeds into a neighbour | Worst spill |
| ------------- | ------------------------------------------ | ----------- |
| Fixed 16px    | 64 of 64                                   | 1.25 deg    |
| Adaptive font | 0 of 64                                    | 0 deg       |

Performance is unaffected, because all of this happens in the single one-off rasterization pass:

| 64 items, ~4.6s spin  | Median   | p95     | Frames slower than 33 ms |
| --------------------- | -------- | ------- | ------------------------ |
| Desktop 1280x800 dpr2 | 16.70 ms | 33.3 ms | 19-27 of ~253            |
| Mobile 375x667 dpr3   | 16.70 ms | 16.8 ms | 1-3 of ~276              |

The winner calculation was re-verified against the rendered rotation after the label changes (8 of
8 spins matched).

## Rules to keep this fast

1. **Never drive canvas redraws from React state in an animation loop.** Rasterize once, then
   animate with `transform` / `opacity` so the work stays on the compositor.
2. **No `filter` / `backdrop-filter` on anything that animates or that sits above the animated
   background.** Filters must be re-rasterized whenever the backdrop or the transform changes.
3. Keep the animation loop's per-frame work to a single style write, and cancel it on unmount.
4. Do not measure text inside a per-frame path; precompute or binary-search it when the wheel is
   drawn.

## Rules to keep labels readable

1. **Any canvas length that is not a path coordinate or `lineWidth` must be checked for DPR
   scaling.** `shadowBlur` is the trap; `shadowOffsetX/Y` scale with the transform.
2. Give white-on-color text a hard `strokeText` outline, not just a shadow.
3. Scope shadows to the shape that needs them - set shadow state inside the `save()` / `restore()`
   of the element that should cast it, or every following fill inherits it.
4. Derive font size from the available space (arc pitch per label), not from a single hardcoded
   value, so dense wheels degrade gracefully instead of overlapping.

## React Compiler / purity

The previously documented "impure function" warnings (`Math.random()`, `Date.now()`) are gone.
`Math.random()` is still only called inside the `spinWheel` event handler, which is always safe;
the now-unnecessary `eslint-disable-next-line` comments were removed. Note that `vite.config.ts`
uses a bare `react()` plugin **without** `babel-plugin-react-compiler`, so there is no React
Compiler in this project and no such warnings are produced.

## Verification

1. `npm run dev`
2. Navigate to `/lucky-wheel`
3. Edit the wheel and paste 60+ items, one per line
4. Click the wheel and confirm smooth motion, a stable pointer, and a correct result dialog
5. Repeat at a mobile viewport (icon-only buttons) and press Enter on the focused wheel
