const fs = require('fs');
const zlib = require('zlib');

function decodePng(file) {
    const buf = fs.readFileSync(file);
    let off = 8, w = 0, h = 0, colorType = 0, bpp = 0, idat = [];
    while (off < buf.length) {
        const len = buf.readUInt32BE(off);
        const type = buf.toString('ascii', off + 4, off + 8);
        if (type === 'IHDR') { w = buf.readUInt32BE(off + 8); h = buf.readUInt32BE(off + 12); colorType = buf[off + 17]; }
        else if (type === 'IDAT') idat.push(buf.slice(off + 8, off + 8 + len));
        off += 8 + len;
    }
    bpp = colorType === 6 ? 4 : colorType === 3 ? 1 : 3;
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const stride = w * bpp;
    const prev = Buffer.alloc(stride);
    const px = Buffer.alloc(w * h * 4);
    let di = 0;
    for (let y = 0; y < h; y++) {
        const ft = raw[di++];
        const line = raw.slice(di, di + stride); di += stride;
        const rec = Buffer.alloc(stride);
        for (let x = 0; x < stride; x++) {
            const a = x >= bpp ? rec[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
            let v = line[x];
            if (ft === 1) v = (v + a) & 255;
            else if (ft === 2) v = (v + b) & 255;
            else if (ft === 3) v = (v + ((a + b) >> 1)) & 255;
            else if (ft === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255; }
            rec[x] = v;
        }
        rec.copy(prev);
        for (let x = 0; x < w; x++) {
            const o = (y * w + x) * 4;
            if (colorType === 2) { px[o] = rec[x * bpp]; px[o + 1] = rec[x * bpp + 1]; px[o + 2] = rec[x * bpp + 2]; px[o + 3] = 255; }
            else if (colorType === 6) { px[o] = rec[x * bpp]; px[o + 1] = rec[x * bpp + 1]; px[o + 2] = rec[x * bpp + 2]; px[o + 3] = rec[x * bpp + 3]; }
        }
    }
    return { w, h, px };
}
function value(c) { return Math.max(c[0], c[1], c[2]); }
function sat(c) { return Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]); }

const { w, h, px } = decodePng('C:/Users/lemin/Projects/ts-web-exercise/src/assets/badges_bronze.png');
function gather(x0, x1, y0, y1) {
    const arr = [];
    for (let y = Math.max(0, y0); y < Math.min(h, y1); y++)
        for (let x = Math.max(0, x0); x < Math.min(w, x1); x++) {
            const o = (y * w + x) * 4; arr.push([px[o], px[o + 1], px[o + 2]]);
        }
    return arr;
}
const gutV1 = gather(184, 196, 0, h);
const gutV234 = gather(345, 358, 0, h); // middle of gutter between col1 and col2
const gutH = gather(0, w, 269, 317);     // band between row1 badge-bottom and row2 badge-top? (row tops at 156 and 417)

function stats(a, label) {
    let mn = 255, mx = 0, s = 0, s2 = 0, satS = 0;
    for (const g of a) { const v = value(g), st = sat(g); if (v < mn) mn = v; if (v > mx) mx = v; s += v; s2 += v * v; satS += st; }
    const n = a.length;
    console.log(label, 'n', n, 'min', mn, 'max', mx, 'mean', (s / n).toFixed(2), 'std', (Math.sqrt(s2 / n - (s / n) ** 2)).toFixed(2), 'avgSat', (satS / n).toFixed(2));
}
stats(gutV1, 'GUT V1   ');
stats(gutV234, 'GUT V234 ');
stats(gutH, 'GUT H    ');

// coarse ASCII map of FULL first cell (55,51..182,261): the badge is dark metal on light bg
const ramp = ' .:-=+*#%@';
let s = '';
for (let y = 51; y < 261; y += 7) {
    let row = '';
    for (let x = 32; x < 182; x += 4) {
        row += ramp[Math.min(9, Math.floor(value([px[(y * w + x) * 4], px[(y * w + x) * 4 + 1], px[(y * w + x) * 4 + 2]]) / 25.6))];
    }
    s += row + '\n';
}
console.log('--- CELL 1 (x32-182, y51-261) coarse ---\n' + s);

// badge interior sample: dark metal around center of first cell
const bd = gather(47, 176, 85, 228);
stats(bd, 'BADGE int ');
const dark = bd.filter(g => value(g) < 110);
console.log('dark badge pixels', dark.length, '/', bd.length, 'sample', dark.slice(0, 6).map(g => g.join(',')));
const white = bd.filter(g => value(g) > 240 && sat(g) < 20);
console.log('white-ish interior px', white.length, 'sample', white.slice(0, 6).map(g => g.join(',')));
