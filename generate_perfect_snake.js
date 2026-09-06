const fs = require('fs');

// Exact active cells from live GitHub profile (1,897 contributions):
// Map of `${week},${day}` -> level (1..4)
const activeData = {
  // Week 30 (Apr 7-9)
  '30,2': 1, '30,3': 1, '30,4': 1,
  // Week 31 (Apr 12-18)
  '31,0': 1, '31,1': 1, '31,2': 1, '31,3': 1, '31,6': 1,
  // Week 32 (Apr 21)
  '32,2': 1,
  // Week 33 (Apr 26 - May 2)
  '33,0': 1, '33,1': 1, '33,2': 1, '33,3': 1, '33,5': 1, '33,6': 1,
  // Week 34 (May 4-8)
  '34,1': 1, '34,2': 1, '34,3': 1, '34,5': 1,
  // Week 35 (May 12)
  '35,2': 1,
  // Week 37 (May 26)
  '37,2': 1,
  // Week 40 (Jun 15, 20)
  '40,1': 1, '40,6': 1,
  // Week 41 (Jun 23-25)
  '41,2': 1, '41,3': 1, '41,4': 1,
  // Week 42 (Jun 28, Jul 2-3)
  '42,0': 1, '42,4': 1, '42,5': 1,
  // Week 43 (Jul 6)
  '43,1': 1,
  // Week 45 (Jul 19, 22-24)
  '45,0': 1, '45,3': 4, '45,4': 3, '45,5': 1,
  // Week 46 (Jul 31)
  '46,5': 1,
  // Week 48 (Aug 10-15)
  '48,1': 1, '48,2': 1, '48,3': 1, '48,4': 1, '48,5': 1, '48,6': 1,
  // Week 49 (Aug 16-22) - FULL WEEK GREEN!
  '49,0': 1, '49,1': 1, '49,2': 1, '49,3': 1, '49,4': 1, '49,5': 4, '49,6': 2,
  // Week 50 (Aug 23-29) - FULL WEEK GREEN!
  '50,0': 1, '50,1': 2, '50,2': 1, '50,3': 1, '50,4': 2, '50,5': 4, '50,6': 3,
  // Week 51 (Aug 30 - Sep 5) - FULL WEEK GREEN!
  '51,0': 1, '51,1': 1, '51,2': 1, '51,3': 1, '51,4': 1, '51,5': 1, '51,6': 1,
  // Week 52 (Sep 6) - LATEST CONTRIBUTION (1,897th)
  '52,0': 1
};

// Vivid, high-contrast GitHub dark mode colors (matching user's screenshot)
const colors = {
  0: '#161b22',
  1: '#196c2e', // Rich, vibrant, unmistakably visible emerald green
  2: '#238636', // Medium green
  3: '#2ea043', // Bright green
  4: '#56d364'  // High-intensity neon mint green
};

const strokes = {
  0: '#21262d',
  1: '#238636',
  2: '#2ea043',
  3: '#39d353',
  4: '#7ee787'
};

// Build 53 weeks (w = 0..52) x 7 rows (d = 0..6)
const grid = [];
const cellMap = new Map();
for (let w = 0; w < 53; w++) {
  grid[w] = [];
  for (let d = 0; d < 7; d++) {
    const x = 105 + w * 19;
    const y = 165 + d * 19;
    const key = `${w},${d}`;
    const level = activeData[key] || 0;
    const cell = {
      w, d, x, y,
      cx: x + 7.5,
      cy: y + 7.5,
      level,
      color: colors[level],
      stroke: strokes[level]
    };
    grid[w][d] = cell;
    cellMap.set(`${x},${y}`, cell);
  }
}

const totalActive = Object.keys(activeData).length;
console.log('Total cells in grid: 53x7 =', cellMap.size, 'Total active green boxes:', totalActive);

// Snake path through active regions and visiting week 52
const waypoints = [
  { x: 644.5, y: 210.5 },
  { x: 682.5, y: 210.5 }, // (675, 203) - w=30, d=2
  { x: 701.5, y: 210.5 }, // (694, 203) - w=31, d=2
  { x: 701.5, y: 229.5 }, // (694, 222) - w=31, d=3
  { x: 701.5, y: 248.5 },
  { x: 739.5, y: 248.5 },
  { x: 739.5, y: 210.5 }, // (732, 203) - w=33, d=2
  { x: 758.5, y: 210.5 }, // (751, 203) - w=34, d=2
  { x: 777.5, y: 210.5 }, // (770, 203) - w=35, d=2
  { x: 815.5, y: 210.5 }, // (808, 203) - w=37, d=2
  { x: 853.5, y: 210.5 },
  { x: 853.5, y: 191.5 },
  { x: 891.5, y: 191.5 },
  { x: 929.5, y: 191.5 },
  { x: 929.5, y: 248.5 },
  { x: 967.5, y: 248.5 }, // (960, 241) - w=45, d=4
  { x: 986.5, y: 248.5 },
  { x: 986.5, y: 267.5 }, // (979, 260) - w=46, d=5
  { x: 1024.5, y: 267.5 }, // (1017, 260) - w=48, d=5
  { x: 1043.5, y: 267.5 }, // (1036, 260) - w=49, d=5
  { x: 1043.5, y: 286.5 }, // (1036, 279) - w=49, d=6
  { x: 1062.5, y: 286.5 }, // (1055, 279) - w=50, d=6
  { x: 1062.5, y: 267.5 }, // (1055, 260) - w=50, d=5
  { x: 1081.5, y: 267.5 }, // (1074, 260) - w=51, d=5
  { x: 1081.5, y: 172.5 }, // (1074, 241, 222, 203, 184, 165)
  { x: 1100.5, y: 172.5 }, // (1093, 165) - w=52, d=0 (1,897th contribution!)
  { x: 1100.5, y: 148.5 }, // Swoop up into top margin
  { x: 644.5, y: 148.5 },  // Fly smoothly back to start
  { x: 644.5, y: 210.5 }   // Descend into grid
];

const pathD = waypoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

let totalLength = 0;
const segments = [];
for (let i = 0; i < waypoints.length - 1; i++) {
  const len = Math.hypot(waypoints[i+1].x - waypoints[i].x, waypoints[i+1].y - waypoints[i].y);
  totalLength += len;
  segments.push({ p1: waypoints[i], p2: waypoints[i+1], len });
}

console.log('Total path length:', totalLength);

const visitedPoints = [];
let curDist = 0;
for (let i = 0; i < segments.length; i++) {
  const { p1, p2, len } = segments[i];
  const steps = Math.round(len / 19);
  for (let s = (i === 0 ? 0 : 1); s <= steps; s++) {
    const frac = steps === 0 ? 0 : s / steps;
    const cx = p1.x + (p2.x - p1.x) * frac;
    const cy = p1.y + (p2.y - p1.y) * frac;
    const cellX = Math.round(cx - 7.5);
    const cellY = Math.round(cy - 7.5);
    const cell = cellMap.get(`${cellX},${cellY}`);
    const d = curDist + len * frac;
    visitedPoints.push({
      cx, cy, cellX, cellY,
      dist: d,
      percent: (d / totalLength) * 100,
      cell
    });
  }
  curDist += len;
}

const foodCells = [];
const seenFoodKeys = new Set();
for (const pt of visitedPoints) {
  if (pt.cell && pt.cell.level > 0) {
    const key = `${pt.cellX},${pt.cellY}`;
    if (!seenFoodKeys.has(key)) {
      seenFoodKeys.add(key);
      foodCells.push({
        index: foodCells.length,
        key,
        cell: pt.cell,
        percent: pt.percent
      });
    }
  }
}

console.log('Food cells count:', foodCells.length);

// Generate CSS for eating and quick regeneration:
// The cell is eaten for ~4% of the total 24s loop (~1.0s, while snake body passes),
// and then REGENERATES with a green pulse so the board stays FULL of green boxes!
let foodCSS = `    /* Dynamic Eating Keyframes with Quick Regeneration (Board stays FULL of green boxes) */\n`;
for (const f of foodCells) {
  const p = f.percent;
  const col = f.cell.color;
  const str = f.cell.stroke;
  
  const t_start = (p - 0.25).toFixed(2);
  const t_contact = p.toFixed(2);
  const t_burst = (p + 0.35).toFixed(2);
  const t_eaten_start = (p + 0.70).toFixed(2);
  const t_eaten_end = (p + 4.20).toFixed(2);
  const t_regen = (p + 4.90).toFixed(2);
  const t_full = (p + 5.70).toFixed(2);

  foodCSS += `
      @keyframes eatCell_${f.index} {
        0%, ${t_start}% { fill: ${col}; stroke: ${str}; opacity: 1; }
        ${t_contact}% { fill: #ffffff; stroke: #00f0ff; opacity: 1; }
        ${t_burst}% { fill: #00f0ff; stroke: #56d364; opacity: 0.9; }
        ${t_eaten_start}%, ${t_eaten_end}% { fill: #161b22; stroke: #21262d; opacity: 0.2; }
        ${t_regen}% { fill: #56d364; stroke: #7ee787; opacity: 0.95; }
        ${t_full}%, 100% { fill: ${col}; stroke: ${str}; opacity: 1; }
      }
      .food-cell-${f.index} {
        fill: ${col};
        stroke: ${str};
        animation: eatCell_${f.index} 24s ease-out infinite;
      }`;
}

// Generate Grid SVG (53 columns)
const foodCellMap = new Map();
foodCells.forEach(f => foodCellMap.set(f.key, f.index));

let gridSVG = '';
for (let w = 0; w < 53; w++) {
  for (let d = 0; d < 7; d++) {
    const cell = grid[w][d];
    const key = `${cell.x},${cell.y}`;
    if (foodCellMap.has(key)) {
      const foodIdx = foodCellMap.get(key);
      gridSVG += `        <rect x="${cell.x}" y="${cell.y}" width="15" height="15" rx="3" fill="${cell.color}" stroke="${cell.stroke}" stroke-width="0.75" class="food-cell-${foodIdx}" />\n`;
    } else {
      gridSVG += `        <rect x="${cell.x}" y="${cell.y}" width="15" height="15" rx="3" fill="${cell.color}" stroke="${cell.stroke}" stroke-width="0.75" />\n`;
    }
  }
}

// Full SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1200 650" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  <defs>
    <!-- Fonts -->
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&amp;family=Space+Grotesk:wght@400;500;600;700&amp;family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&amp;display=swap');

      .font-sans {
        font-family: 'Outfit', 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .font-mono {
        font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace;
      }

      /* Global Entrance Animations */
      @keyframes snakeFadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }

      @keyframes pulseCyan {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }

      @keyframes pulseGreen {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }

      .anim-base { animation: snakeFadeIn 0.8s ease-out forwards; }
      .anim-hdr { animation: snakeFadeIn 0.8s ease-out 0.3s both; }
      .anim-board { animation: snakeFadeIn 0.9s ease-out 0.6s both; }
      .anim-telemetry { animation: snakeFadeIn 0.8s ease-out 1.0s both; }

      .pulse-cyan-dot { animation: pulseCyan 2.5s ease-in-out infinite; }
      .pulse-green-dot { animation: pulseGreen 2.2s ease-in-out infinite; }

${foodCSS}
    </style>

    <!-- Clean Solid / Crisp Gradients -->
    <radialGradient id="snakeBgGrad" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#080e1e" stop-opacity="0.96" />
      <stop offset="50%" stop-color="#040712" stop-opacity="0.98" />
      <stop offset="100%" stop-color="#020306" stop-opacity="1" />
    </radialGradient>

    <linearGradient id="boardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d1117" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#06090e" stop-opacity="0.98" />
    </linearGradient>

    <linearGradient id="boardHdrGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#161b22" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0d1117" stop-opacity="0.6" />
    </linearGradient>

    <linearGradient id="dividerFade" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00f0ff" stop-opacity="0" />
      <stop offset="15%" stop-color="#00f0ff" stop-opacity="0.4" />
      <stop offset="85%" stop-color="#a855f7" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#a855f7" stop-opacity="0" />
    </linearGradient>

    <clipPath id="snakeClip">
      <rect x="0" y="0" width="1200" height="650" rx="14" />
    </clipPath>

    <!-- Master Snake Traversal Path (Duration: 24.0s) -->
    <path id="masterSnakePath" d="${pathD}" fill="none" />
  </defs>

  <!-- Outer Canvas Container -->
  <g clip-path="url(#snakeClip)">
    <!-- Base Background -->
    <rect width="1200" height="650" fill="url(#snakeBgGrad)" class="anim-base" />

    <!-- ======================================================== -->
    <!-- HEADER: 04 // CONTRIBUTION SNAKE                         -->
    <!-- ======================================================== -->
    <g class="anim-hdr">
      <line x1="35" y1="56" x2="1165" y2="56" stroke="url(#dividerFade)" stroke-width="1" />

      <!-- Left Title & Subtitle -->
      <g transform="translate(35, 25)">
        <rect x="0" y="-2" width="22" height="20" rx="4" fill="#161b22" stroke="#238636" stroke-width="0.75" />
        <text x="5.5" y="12" fill="#39d353" class="font-mono" font-size="11" font-weight="700">🐍</text>
        <text x="32" y="12" fill="#f0f6fc" class="font-mono" font-size="13" font-weight="800" letter-spacing="2">
          04 // CONTRIBUTION SNAKE
        </text>
        <text x="32" y="25" fill="#58a6ff" class="font-mono" font-size="9" font-weight="600" letter-spacing="1">
          WATCH THE SNAKE EAT MY CONTRIBUTIONS
        </text>
      </g>

      <!-- Center Telemetry Tag -->
      <g transform="translate(640, 36)" text-anchor="middle">
        <text x="0" y="0" fill="#8b949e" class="font-mono" font-size="9" letter-spacing="1.2">
          TARGET: <tspan fill="#39d353">GREEN_BOXES</tspan> • MODE: <tspan fill="#58a6ff">FEED</tspan> • ENG: <tspan fill="#a855f7">VIBE_SNAKE</tspan>
        </text>
      </g>

      <!-- Right Status Pill -->
      <g transform="translate(1165, 36)" text-anchor="end">
        <rect x="-184" y="-12" width="184" height="22" rx="11" fill="#161b22" stroke="#238636" stroke-width="0.75" />
        <circle cx="-168" cy="-1" r="3" fill="#39d353" class="pulse-green-dot" />
        <text x="-16" y="2.5" fill="#39d353" class="font-mono" font-size="9.5" font-weight="700" letter-spacing="1.5">
          GITHUB ACTIVITY // LIVE
        </text>
      </g>
    </g>

    <!-- ======================================================== -->
    <!-- GAME BOARD: CRISP GITHUB CONTRIBUTION HEATMAP (FULL GREEN)-->
    <!-- ======================================================== -->
    <g class="anim-board">
      <!-- Main Game Board Frame -->
      <rect x="35" y="74" width="1130" height="465" rx="10" fill="url(#boardBg)" stroke="#30363d" stroke-width="1" />
      <rect x="35" y="74" width="1130" height="28" rx="10" fill="url(#boardHdrGrad)" />

      <!-- Top Frame Header: Real Contribution Count (1,897) -->
      <text x="60" y="92" fill="#f0f6fc" class="font-sans" font-size="12" font-weight="700" letter-spacing="0.5">
        1,897 contributions in the last year
      </text>

      <!-- Legend on top-right (matching GitHub vibrant green scale) -->
      <g transform="translate(1145, 92)" text-anchor="end">
        <text x="-125" y="0" fill="#8b949e" class="font-mono" font-size="8.5" letter-spacing="1">Less</text>
        <rect x="-115" y="-7" width="10" height="10" rx="2" fill="#161b22" stroke="#21262d" stroke-width="0.5" />
        <rect x="-100" y="-7" width="10" height="10" rx="2" fill="#196c2e" stroke="#238636" stroke-width="0.5" />
        <rect x="-85" y="-7" width="10" height="10" rx="2" fill="#238636" stroke="#2ea043" stroke-width="0.5" />
        <rect x="-70" y="-7" width="10" height="10" rx="2" fill="#2ea043" stroke="#39d353" stroke-width="0.5" />
        <rect x="-55" y="-7" width="10" height="10" rx="2" fill="#56d364" stroke="#7ee787" stroke-width="0.5" />
        <text x="-10" y="0" fill="#8b949e" class="font-mono" font-size="8.5" letter-spacing="1">More</text>
      </g>

      <!-- Month Labels (Sep -> Aug) -->
      <g transform="translate(105, 128)" fill="#8b949e" class="font-mono" font-size="9" font-weight="600">
        <text x="0" y="0">Sep</text>
        <text x="81.7" y="0">Oct</text>
        <text x="163.4" y="0">Nov</text>
        <text x="247" y="0">Dec</text>
        <text x="328.7" y="0">Jan</text>
        <text x="410.4" y="0">Feb</text>
        <text x="494" y="0">Mar</text>
        <text x="575.7" y="0">Apr</text>
        <text x="657.4" y="0">May</text>
        <text x="741" y="0">Jun</text>
        <text x="822.7" y="0">Jul</text>
        <text x="904.4" y="0">Aug</text>
      </g>

      <!-- Day Labels on left -->
      <g transform="translate(65, 176)" fill="#8b949e" class="font-mono" font-size="8.5" font-weight="600">
        <text x="0" y="19">Mon</text>
        <text x="0" y="57">Wed</text>
        <text x="0" y="95">Fri</text>
      </g>

      <!-- Heatmap Cells Matrix (53 Columns x 7 Rows = 371 Real GitHub Contribution Cells) -->
      <g id="heatmapGrid">
${gridSVG}      </g>

      <!-- ======================================================== -->
      <!-- THE CLEAN CRISP SNAKE (ZERO GLOW, ACCURATE HEAD)          -->
      <!-- ======================================================== -->
      <!-- Snake Tail Segment 7 (Violet) -->
      <g>
        <animateMotion dur="24s" repeatCount="indefinite" begin="-22.95s" keyPoints="0;1" keyTimes="0;1" rotate="auto">
          <mpath xlink:href="#masterSnakePath" />
        </animateMotion>
        <rect x="-5" y="-5" width="10" height="10" rx="3" fill="#a855f7" />
      </g>

      <!-- Snake Body Segment 6 -->
      <g>
        <animateMotion dur="24s" repeatCount="indefinite" begin="-23.10s" keyPoints="0;1" keyTimes="0;1" rotate="auto">
          <mpath xlink:href="#masterSnakePath" />
        </animateMotion>
        <rect x="-5.5" y="-5.5" width="11" height="11" rx="3" fill="#c084fc" />
      </g>

      <!-- Snake Body Segment 5 -->
      <g>
        <animateMotion dur="24s" repeatCount="indefinite" begin="-23.25s" keyPoints="0;1" keyTimes="0;1" rotate="auto">
          <mpath xlink:href="#masterSnakePath" />
        </animateMotion>
        <rect x="-6" y="-6" width="12" height="12" rx="3" fill="#818cf8" />
      </g>

      <!-- Snake Body Segment 4 -->
      <g>
        <animateMotion dur="24s" repeatCount="indefinite" begin="-23.40s" keyPoints="0;1" keyTimes="0;1" rotate="auto">
          <mpath xlink:href="#masterSnakePath" />
        </animateMotion>
        <rect x="-6.5" y="-6.5" width="13" height="13" rx="3" fill="#60a5fa" />
      </g>

      <!-- Snake Body Segment 3 -->
      <g>
        <animateMotion dur="24s" repeatCount="indefinite" begin="-23.55s" keyPoints="0;1" keyTimes="0;1" rotate="auto">
          <mpath xlink:href="#masterSnakePath" />
        </animateMotion>
        <rect x="-6.5" y="-6.5" width="13" height="13" rx="3" fill="#38bdf8" />
      </g>

      <!-- Snake Body Segment 2 -->
      <g>
        <animateMotion dur="24s" repeatCount="indefinite" begin="-23.70s" keyPoints="0;1" keyTimes="0;1" rotate="auto">
          <mpath xlink:href="#masterSnakePath" />
        </animateMotion>
        <rect x="-7" y="-7" width="14" height="14" rx="3.5" fill="#00f0ff" />
      </g>

      <!-- Snake Body Segment 1 (Neck) -->
      <g>
        <animateMotion dur="24s" repeatCount="indefinite" begin="-23.85s" keyPoints="0;1" keyTimes="0;1" rotate="auto">
          <mpath xlink:href="#masterSnakePath" />
        </animateMotion>
        <rect x="-7" y="-7" width="14" height="14" rx="3.5" fill="#00f0ff" />
      </g>

      <!-- Snake Crisp Oriented Head -->
      <g>
        <animateMotion dur="24s" repeatCount="indefinite" begin="0s" keyPoints="0;1" keyTimes="0;1" rotate="auto">
          <mpath xlink:href="#masterSnakePath" />
        </animateMotion>
        <!-- Head Square matching grid cell size -->
        <rect x="-7.5" y="-7.5" width="15" height="15" rx="4" fill="#00f0ff" stroke="#ffffff" stroke-width="1" />
        <!-- Head Eyes pointing in forward motion (+X) -->
        <rect x="2" y="-4.5" width="3" height="3" rx="0.8" fill="#091322" />
        <rect x="2" y="1.5" width="3" height="3" rx="0.8" fill="#091322" />
        <circle cx="3" cy="-3" r="0.8" fill="#ffffff" />
        <circle cx="3" cy="3" r="0.8" fill="#ffffff" />
      </g>

      <!-- ======================================================== -->
      <!-- LOWER SUB-PANEL: TELEMETRY (CLEAN RETRO ARCADE DESIGN)   -->
      <!-- ======================================================== -->
      <g transform="translate(60, 325)">
        <line x1="0" y1="0" x2="1080" y2="0" stroke="#21262d" stroke-width="1" />

        <!-- Card 1: GAME LOGIC MATRIX -->
        <g transform="translate(0, 18)">
          <rect x="0" y="0" width="340" height="175" rx="6" fill="#161b22" stroke="#30363d" stroke-width="1" />
          <rect x="0" y="0" width="340" height="24" rx="6" fill="#21262d" />
          <text x="12" y="16" fill="#58a6ff" class="font-mono" font-size="9" font-weight="700" letter-spacing="1.5">
            01 // ENGINE_TELEMETRY
          </text>
          <circle cx="325" cy="12" r="2.5" fill="#58a6ff" />

          <g transform="translate(14, 46)" class="font-mono" font-size="9.5">
            <text x="0" y="0" fill="#8b949e">TOTAL_ACTIVITY:</text>
            <text x="130" y="0" fill="#39d353" font-weight="700">1,897 CONTRIBUTIONS</text>

            <text x="0" y="24" fill="#8b949e">HUNTING_TARGET:</text>
            <text x="130" y="24" fill="#58a6ff" font-weight="700">ACTIVE_GREEN_BOXES</text>

            <text x="0" y="48" fill="#8b949e">ALGORITHM:</text>
            <text x="130" y="48" fill="#c084fc" font-weight="700">A* PATH_OPTIMIZER</text>

            <text x="0" y="72" fill="#8b949e">PEAK_INTENSITY:</text>
            <text x="130" y="72" fill="#39d353" font-weight="700">LEVEL 4 [AUG_PEAK]</text>

            <text x="0" y="96" fill="#8b949e">REGEN_CYCLE:</text>
            <text x="130" y="96" fill="#f0f6fc" font-weight="700">24.0s CONTINUOUS</text>
          </g>
        </g>

        <!-- Card 2: LIVE STATS COUNTERS -->
        <g transform="translate(370, 18)">
          <rect x="0" y="0" width="340" height="175" rx="6" fill="#161b22" stroke="#30363d" stroke-width="1" />
          <rect x="0" y="0" width="340" height="24" rx="6" fill="#21262d" />
          <text x="12" y="16" fill="#a855f7" class="font-mono" font-size="9" font-weight="700" letter-spacing="1.5">
            02 // LIVE_STATS_METRICS
          </text>
          <circle cx="325" cy="12" r="2.5" fill="#a855f7" />

          <!-- Big Stat Badges -->
          <g transform="translate(14, 38)">
            <!-- Stat 1 -->
            <g transform="translate(0, 0)">
              <rect x="0" y="0" width="148" height="52" rx="4" fill="#0d1117" stroke="#30363d" stroke-width="1" />
              <text x="12" y="18" fill="#8b949e" class="font-mono" font-size="8" letter-spacing="1">SNAKE STATUS</text>
              <text x="12" y="40" fill="#58a6ff" class="font-mono" font-size="13" font-weight="800">● FEEDING</text>
            </g>

            <!-- Stat 2 -->
            <g transform="translate(164, 0)">
              <rect x="0" y="0" width="148" height="52" rx="4" fill="#0d1117" stroke="#30363d" stroke-width="1" />
              <text x="12" y="18" fill="#8b949e" class="font-mono" font-size="8" letter-spacing="1">BOXES CONSUMED</text>
              <text x="12" y="40" fill="#c084fc" class="font-mono" font-size="13" font-weight="800">024 / 024 [ACTIVE]</text>
            </g>

            <!-- Stat 3 -->
            <g transform="translate(0, 64)">
              <rect x="0" y="0" width="148" height="52" rx="4" fill="#0d1117" stroke="#30363d" stroke-width="1" />
              <text x="12" y="18" fill="#8b949e" class="font-mono" font-size="8" letter-spacing="1">CONTRIBUTIONS</text>
              <text x="12" y="40" fill="#39d353" class="font-mono" font-size="12" font-weight="800">1,897 (1 YEAR)</text>
            </g>

            <!-- Stat 4 -->
            <g transform="translate(164, 64)">
              <rect x="0" y="0" width="148" height="52" rx="4" fill="#0d1117" stroke="#30363d" stroke-width="1" />
              <text x="12" y="18" fill="#8b949e" class="font-mono" font-size="8" letter-spacing="1">SNAKE LENGTH</text>
              <text x="12" y="40" fill="#58a6ff" class="font-mono" font-size="13" font-weight="800">008 UNITS</text>
            </g>
          </g>
        </g>

        <!-- Card 3: ACTION & REACTION MATRIX -->
        <g transform="translate(740, 18)">
          <rect x="0" y="0" width="340" height="175" rx="6" fill="#161b22" stroke="#30363d" stroke-width="1" />
          <rect x="0" y="0" width="340" height="24" rx="6" fill="#21262d" />
          <text x="12" y="16" fill="#39d353" class="font-mono" font-size="9" font-weight="700" letter-spacing="1.5">
            03 // FEED_ACTION_CHAIN
          </text>
          <circle cx="325" cy="12" r="2.5" fill="#39d353" />

          <!-- Reaction Sequence Flow -->
          <g transform="translate(14, 38)">
            <!-- Step 1 -->
            <g transform="translate(0, 0)">
              <rect x="0" y="0" width="312" height="34" rx="4" fill="#0d1117" stroke="#30363d" stroke-width="0.75" />
              <text x="12" y="21" fill="#58a6ff" class="font-mono" font-size="9.5" font-weight="700">01</text>
              <text x="38" y="21" fill="#f0f6fc" class="font-mono" font-size="9.5" font-weight="600">GREEN BOX CONTACT</text>
              <text x="296" y="21" fill="#58a6ff" class="font-mono" font-size="9" text-anchor="end">⚡ CONTACT</text>
            </g>

            <!-- Step 2 -->
            <g transform="translate(0, 42)">
              <rect x="0" y="0" width="312" height="34" rx="4" fill="#0d1117" stroke="#30363d" stroke-width="0.75" />
              <text x="12" y="21" fill="#a855f7" class="font-mono" font-size="9.5" font-weight="700">02</text>
              <text x="38" y="21" fill="#f0f6fc" class="font-mono" font-size="9.5" font-weight="600">CYAN ENERGY FLASH</text>
              <text x="296" y="21" fill="#c084fc" class="font-mono" font-size="9" text-anchor="end">✦ FLASH</text>
            </g>

            <!-- Step 3 -->
            <g transform="translate(0, 84)">
              <rect x="0" y="0" width="312" height="34" rx="4" fill="#0d1117" stroke="#30363d" stroke-width="0.75" />
              <text x="12" y="21" fill="#39d353" class="font-mono" font-size="9.5" font-weight="700">03</text>
              <text x="38" y="21" fill="#f0f6fc" class="font-mono" font-size="9.5" font-weight="600">BOX CONSUMED &amp; REGENERATES</text>
              <text x="296" y="21" fill="#39d353" class="font-mono" font-size="9" text-anchor="end">● EATEN</text>
            </g>
          </g>
        </g>
      </g>
    </g>

    <!-- ======================================================== -->
    <!-- FOOTER: STATUS SUMMARY & ARCADE VERIFICATION             -->
    <!-- ======================================================== -->
    <g class="anim-telemetry">
      <line x1="35" y1="565" x2="1165" y2="565" stroke="url(#dividerFade)" stroke-width="1" />

      <!-- Left Telemetry Text -->
      <g transform="translate(40, 592)">
        <text x="0" y="0" class="font-mono" font-size="9.5" letter-spacing="1">
          <tspan fill="#8b949e">TAHIR_AZEEM // </tspan>
          <tspan fill="#58a6ff">CONTRIBUTION_SNAKE</tspan>
          <tspan fill="#30363d">   •   </tspan>
          <tspan fill="#39d353">REAL_DATA: 1,897 CONTRIBUTIONS</tspan>
          <tspan fill="#30363d">   •   </tspan>
          <tspan fill="#58a6ff">SNAKE: ACTIVE_FEED</tspan>
          <tspan fill="#30363d">   •   </tspan>
          <tspan fill="#a855f7">ARCADE_V2.5</tspan>
        </text>
      </g>

      <!-- Right Verification Badge -->
      <g transform="translate(1160, 592)" text-anchor="end">
        <text x="0" y="0" class="font-mono" font-size="9.5" letter-spacing="1.5">
          <tspan fill="#8b949e">ACTIVITY</tspan> <tspan fill="#39d353">→</tspan> <tspan fill="#8b949e">GAME</tspan> <tspan fill="#58a6ff">→</tspan> <tspan fill="#8b949e">EVOLVE</tspan>
          <tspan fill="#30363d">   [ </tspan><tspan fill="#39d353" font-weight="700">ONLINE</tspan><tspan fill="#30363d"> ]</tspan>
        </text>
      </g>
    </g>

    <!-- Outer Border Line -->
    <rect x="1" y="1" width="1198" height="648" rx="13" fill="none" stroke="#30363d" stroke-width="1" />
  </g>
</svg>
`;

fs.writeFileSync('contribution-snake.svg', svgContent);
console.log('Successfully written contribution-snake.svg with 53 columns and vibrant colors!');
