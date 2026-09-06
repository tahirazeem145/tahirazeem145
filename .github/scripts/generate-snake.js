const fs = require('fs');
const path = require('path');

const USERNAME = process.env.GITHUB_USER || 'tahirazeem145';
const TARGET_SVG_PATH = path.join(__dirname, '..', '..', 'contribution-snake.svg');

async function fetchContributions(username) {
  // Method 1: jogruber public API
  try {
    const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`);
    if (res.ok) {
      const json = await res.json();
      if (json.contributions && json.contributions.length > 0) {
        console.log(`Fetched ${json.contributions.length} days via jogruber API. Total: ${json.total.lastYear}`);
        return {
          total: json.total.lastYear || 0,
          days: json.contributions
        };
      }
    }
  } catch (e) {
    console.warn('jogruber API failed:', e.message);
  }

  // Method 2: GitHub GraphQL API
  if (process.env.GITHUB_TOKEN) {
    try {
      const query = `
        query($login: String!) {
          user(login: $login) {
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    contributionCount
                    date
                    weekday
                    contributionLevel
                  }
                }
              }
            }
          }
        }
      `;
      const ghRes = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
          'User-Agent': 'github-actions-snake-generator'
        },
        body: JSON.stringify({ query, variables: { login: username } })
      });
      if (ghRes.ok) {
        const ghData = await ghRes.json();
        const cal = ghData.data.user.contributionsCollection.contributionCalendar;
        const days = [];
        for (const week of cal.weeks) {
          for (const d of week.contributionDays) {
            const levelMap = { 'NONE': 0, 'FIRST_QUARTILE': 1, 'SECOND_QUARTILE': 2, 'THIRD_QUARTILE': 3, 'FOURTH_QUARTILE': 4 };
            days.push({
              date: d.date,
              count: d.contributionCount,
              level: levelMap[d.contributionLevel] ?? (d.contributionCount > 0 ? 1 : 0)
            });
          }
        }
        return { total: cal.totalContributions, days };
      }
    } catch (e) {
      console.warn('GitHub GraphQL failed:', e.message);
    }
  }

  throw new Error('Unable to fetch GitHub contributions from all sources.');
}

function buildGrid(days) {
  // GitHub heatmap standard: 53 columns x 7 days (Sun=0 ... Sat=6)
  // Each day in days has date (YYYY-MM-DD), count, level
  // Days are sorted chronologically
  const totalDays = days.length;
  // Determine start weekday
  const firstDate = new Date(days[0].date);
  const startWeekday = firstDate.getUTCDay(); // 0 is Sunday

  // Arrange into 53 columns x 7 rows
  const grid = [];
  let dayIdx = 0;

  for (let c = 0; c < 53; c++) {
    for (let r = 0; r < 7; r++) {
      if (c === 0 && r < startWeekday) {
        // Before start of data range
        grid.push({ col: c, row: r, level: 0, count: 0, date: null });
      } else if (dayIdx < totalDays) {
        const d = days[dayIdx++];
        grid.push({ col: c, row: r, level: d.level, count: d.count, date: d.date });
      } else {
        // Beyond data range (future days of current week)
        grid.push({ col: c, row: r, level: 0, count: 0, date: null });
      }
    }
  }

  return grid;
}

function getMonthLabels(grid) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const labels = [];
  let lastMonth = -1;

  for (let c = 0; c < 53; c++) {
    const firstCellInCol = grid.find(cell => cell.col === c && cell.date !== null);
    if (firstCellInCol && firstCellInCol.date) {
      const m = new Date(firstCellInCol.date).getUTCMonth();
      if (m !== lastMonth) {
        labels.push({ col: c, name: months[m], x: 105 + c * 19 });
        lastMonth = m;
      }
    }
  }

  // Filter labels that are too close (at least 3 columns apart)
  const filtered = [];
  for (let i = 0; i < labels.length; i++) {
    if (i === 0 || labels[i].col - filtered[filtered.length - 1].col >= 3) {
      filtered.push(labels[i]);
    }
  }
  return filtered;
}

function bfsGridPath(fromCol, fromRow, toCol, toRow) {
  const queue = [[{ col: fromCol, row: fromRow }]];
  const visited = new Set([`${fromCol},${fromRow}`]);
  while (queue.length > 0) {
    const path = queue.shift();
    const curr = path[path.length - 1];
    if (curr.col === toCol && curr.row === toRow) {
      return path;
    }
    const dirs = [
      { col: curr.col + 1, row: curr.row },
      { col: curr.col - 1, row: curr.row },
      { col: curr.col, row: curr.row + 1 },
      { col: curr.col, row: curr.row - 1 }
    ];
    for (const d of dirs) {
      if (d.col >= 0 && d.col < 53 && d.row >= 0 && d.row < 7) {
        const key = `${d.col},${d.row}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push([...path, d]);
        }
      }
    }
  }
  return null;
}

function solveSnakeTour(targets) {
  if (targets.length === 0) {
    return { pathD: 'M 105 172.5 L 1100 172.5 L 105 172.5', orderedTargets: [] };
  }

  const targetMap = new Map();
  targets.forEach(t => targetMap.set(`${t.col},${t.row}`, t));

  // Start approach 1 cell to the left of first target
  const firstTarget = targets[0];
  const startCol = Math.max(0, firstTarget.col - 1);
  const startRow = firstTarget.row;

  const pathGridCells = [{ col: startCol, row: startRow }, { col: firstTarget.col, row: firstTarget.row }];
  const uneaten = new Set(targets.map(t => t.id));
  const orderedTargets = [];

  // Eat first target
  if (uneaten.has(firstTarget.id)) {
    uneaten.delete(firstTarget.id);
    firstTarget.cellIdx = 1;
    orderedTargets.push(firstTarget);
  }

  let currPos = { col: firstTarget.col, row: firstTarget.row };

  while (uneaten.size > 0) {
    // Find closest uneaten target by Manhattan distance
    let closest = null;
    let minDist = Infinity;
    for (const id of uneaten) {
      const t = targets.find(item => item.id === id);
      const dist = Math.abs(t.col - currPos.col) + Math.abs(t.row - currPos.row);
      if (dist < minDist) {
        minDist = dist;
        closest = t;
      }
    }

    const subPath = bfsGridPath(currPos.col, currPos.row, closest.col, closest.row);
    for (let i = 1; i < subPath.length; i++) {
      const p = subPath[i];
      pathGridCells.push(p);
      const t = targetMap.get(`${p.col},${p.row}`);
      if (t && uneaten.has(t.id)) {
        uneaten.delete(t.id);
        t.cellIdx = pathGridCells.length - 1;
        orderedTargets.push(t);
      }
    }
    currPos = { col: closest.col, row: closest.row };
  }

  // Return to start approach cell
  const returnPath = bfsGridPath(currPos.col, currPos.row, startCol, startRow);
  for (let i = 1; i < returnPath.length; i++) {
    pathGridCells.push(returnPath[i]);
  }

  // Convert grid cells to pixel coordinates
  const pts = pathGridCells.map(c => ({
    x: 105 + c.col * 19 + 7.5,
    y: 165 + c.row * 19 + 7.5
  }));

  // Compress collinear segments
  const compressedPts = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = compressedPts[compressedPts.length - 1];
    const curr = pts[i];
    const next = pts[i + 1];
    const dx1 = curr.x - prev.x, dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x, dy2 = next.y - curr.y;
    if (dx1 * dy2 !== dy1 * dx2 || (dx1 === 0 && dx2 === 0 && Math.sign(dy1) !== Math.sign(dy2)) || (dy1 === 0 && dy2 === 0 && Math.sign(dx1) !== Math.sign(dx2))) {
      compressedPts.push(curr);
    }
  }
  compressedPts.push(pts[pts.length - 1]);

  // Compute cumulative distances
  compressedPts[0].dist = 0;
  let totalDist = 0;
  for (let i = 1; i < compressedPts.length; i++) {
    totalDist += Math.hypot(compressedPts[i].x - compressedPts[i-1].x, compressedPts[i].y - compressedPts[i-1].y);
    compressedPts[i].dist = totalDist;
  }

  // Calculate hit percentage for each eaten target
  orderedTargets.forEach(t => {
    const pt = pts[t.cellIdx];
    for (let i = 0; i < compressedPts.length - 1; i++) {
      const p1 = compressedPts[i];
      const p2 = compressedPts[i + 1];
      const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const d1 = Math.hypot(pt.x - p1.x, pt.y - p1.y);
      const d2 = Math.hypot(pt.x - p2.x, pt.y - p2.y);
      if (Math.abs(d1 + d2 - segLen) < 0.1) {
        t.hitDist = p1.dist + d1;
        t.hitPct = totalDist > 0 ? (t.hitDist / totalDist) * 100 : 0;
        break;
      }
    }
  });

  // Build SVG path string
  const dParts = [`M ${compressedPts[0].x.toFixed(1)} ${compressedPts[0].y.toFixed(1)}`];
  for (let i = 1; i < compressedPts.length; i++) {
    dParts.push(`L ${compressedPts[i].x.toFixed(1)} ${compressedPts[i].y.toFixed(1)}`);
  }
  const pathD = dParts.join(' ');

  return { pathD, orderedTargets };
}

async function generate() {
  console.log(`Generating contribution snake for user: ${USERNAME}...`);
  const { total, days } = await fetchContributions(USERNAME);
  const grid = buildGrid(days);
  const months = getMonthLabels(grid);

  const levelColors = {
    0: { fill: '#161b22', stroke: '#21262d' },
    1: { fill: '#196c2e', stroke: '#238636' },
    2: { fill: '#238636', stroke: '#2ea043' },
    3: { fill: '#2ea043', stroke: '#39d353' },
    4: { fill: '#56d364', stroke: '#7ee787' }
  };

  // Collect food targets
  const targets = [];
  let foodId = 0;
  grid.forEach((cell, idx) => {
    const cx = 105 + cell.col * 19 + 7.5;
    const cy = 165 + cell.row * 19 + 7.5;
    cell.x = 105 + cell.col * 19;
    cell.y = 165 + cell.row * 19;
    cell.cx = cx;
    cell.cy = cy;
    cell.idx = idx;

    if (cell.level > 0) {
      cell.foodId = foodId++;
      targets.push({
        id: cell.foodId,
        cellIdx: idx,
        col: cell.col,
        row: cell.row,
        cx,
        cy,
        level: cell.level,
        origFill: levelColors[cell.level].fill,
        origStroke: levelColors[cell.level].stroke
      });
    }
  });

  console.log(`Found ${targets.length} green contribution boxes to eat.`);
  const { pathD, orderedTargets } = solveSnakeTour(targets);

  // Generate CSS Keyframes for each target
  // Rules:
  // 1. Normal color until contact
  // 2. Flash cyan/white at contact
  // 3. Disappear completely (opacity: 0)
  // 4. Stay disappeared until 96.0%
  // 5. All eaten boxes reappear together at 97.5% - 100%
  const keyframesCSS = orderedTargets.map(t => {
    const p = t.hitPct;
    const pPre = Math.max(0, p - 0.20).toFixed(2);
    const pContact = p.toFixed(2);
    const pFlash = Math.min(95.5, p + 0.25).toFixed(2);
    const pGone = Math.min(95.8, p + 0.50).toFixed(2);

    return `
      @keyframes eatCell_${t.id} {
        0%, ${pPre}% { fill: ${t.origFill}; stroke: ${t.origStroke}; opacity: 1; }
        ${pContact}% { fill: #ffffff; stroke: #00f0ff; opacity: 1; }
        ${pFlash}% { fill: #00f0ff; stroke: #38bdf8; opacity: 0.9; }
        ${pGone}%, 96.0% { fill: #161b22; stroke: #21262d; opacity: 0; }
        96.8% { fill: #ffffff; stroke: #00f0ff; opacity: 0.85; }
        97.5%, 100% { fill: ${t.origFill}; stroke: ${t.origStroke}; opacity: 1; }
      }
      .food-cell-${t.id} {
        fill: ${t.origFill};
        stroke: ${t.origStroke};
        animation: eatCell_${t.id} 24s linear infinite !important;
      }`;
  }).join('\n');

  // Month labels SVG
  const monthTexts = months.map(m => `<text x="${m.x - 105}" y="0">${m.name}</text>`).join('\n        ');

  // Grid Rectangles SVG (Base cell under each food cell so disappearance shows empty cell)
  const gridRects = grid.map(cell => {
    const baseCell = `<rect x="${cell.x}" y="${cell.y}" width="15" height="15" rx="3" fill="#161b22" stroke="#21262d" stroke-width="0.75" />`;
    if (cell.level > 0 && cell.foodId !== undefined) {
      return `${baseCell}\n        <rect class="food-cell-${cell.foodId}" x="${cell.x}" y="${cell.y}" width="15" height="15" rx="3" stroke-width="0.75" />`;
    } else {
      return baseCell;
    }
  }).join('\n        ');

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1200 350" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
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

      .pulse-cyan-dot { animation: pulseCyan 2.5s ease-in-out infinite; }
      .pulse-green-dot { animation: pulseGreen 2.2s ease-in-out infinite; }

      /* Dynamic Real Contribution Boxes: Eat -> Disappear -> Reappear Together */
${keyframesCSS}
    </style>

    <!-- Linear Gradients -->
    <linearGradient id="snakeBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080c14" />
      <stop offset="50%" stop-color="#0d1117" />
      <stop offset="100%" stop-color="#080c14" />
    </linearGradient>

    <linearGradient id="boardBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0d1117" />
      <stop offset="100%" stop-color="#090d13" />
    </linearGradient>

    <linearGradient id="boardHdrGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#161b22" stop-opacity="0.8" />
      <stop offset="50%" stop-color="#21262d" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#161b22" stop-opacity="0.8" />
    </linearGradient>

    <linearGradient id="dividerFade" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00f0ff" stop-opacity="0" />
      <stop offset="15%" stop-color="#00f0ff" stop-opacity="0.4" />
      <stop offset="85%" stop-color="#a855f7" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#a855f7" stop-opacity="0" />
    </linearGradient>

    <clipPath id="snakeClip">
      <rect x="0" y="0" width="1200" height="350" rx="14" />
    </clipPath>

    <!-- Master Snake Traversal Path (Visits ALL ${targets.length} targets, strictly inside grid) -->
    <path id="masterSnakePath" d="${pathD}" fill="none" />
  </defs>

  <!-- Outer Canvas Container -->
  <g clip-path="url(#snakeClip)">
    <!-- Base Background -->
    <rect width="1200" height="350" fill="url(#snakeBgGrad)" class="anim-base" />

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
          TARGET: <tspan fill="#39d353">ALL_${targets.length}_BOXES</tspan> • MODE: <tspan fill="#58a6ff">FEED_ALL</tspan> • ENG: <tspan fill="#a855f7">VIBE_SNAKE</tspan>
        </text>
      </g>

      <!-- Right Status Pill -->
      <g transform="translate(1165, 36)" text-anchor="end">
        <rect x="-184" y="-12" width="184" height="22" rx="11" fill="#161b22" stroke="#238636" stroke-width="0.75" />
        <circle cx="-168" cy="-1" r="3.5" fill="#39d353" class="pulse-green-dot" />
        <text x="-155" y="2.5" fill="#f0f6fc" class="font-mono" font-size="9" font-weight="600" letter-spacing="1">
          LIVE AUTONOMOUS GAME
        </text>
      </g>
    </g>

    <!-- ======================================================== -->
    <!-- GAME BOARD: CRISP GITHUB CONTRIBUTION HEATMAP            -->
    <!-- ======================================================== -->
    <g class="anim-board">
      <!-- Main Game Board Frame -->
      <rect x="35" y="74" width="1130" height="246" rx="10" fill="url(#boardBg)" stroke="#30363d" stroke-width="1" />
      <rect x="35" y="74" width="1130" height="28" rx="10" fill="url(#boardHdrGrad)" />

      <!-- Top Frame Header: Real Contribution Count -->
      <text x="60" y="92" fill="#f0f6fc" class="font-sans" font-size="12" font-weight="700" letter-spacing="0.5">
        ${total.toLocaleString()} contributions in the last year
      </text>

      <!-- Legend on top-right -->
      <g transform="translate(1145, 92)" text-anchor="end">
        <text x="-125" y="0" fill="#8b949e" class="font-mono" font-size="8.5" letter-spacing="1">Less</text>
        <rect x="-115" y="-7" width="10" height="10" rx="2" fill="#161b22" stroke="#21262d" stroke-width="0.5" />
        <rect x="-100" y="-7" width="10" height="10" rx="2" fill="#196c2e" stroke="#238636" stroke-width="0.5" />
        <rect x="-85" y="-7" width="10" height="10" rx="2" fill="#238636" stroke="#2ea043" stroke-width="0.5" />
        <rect x="-70" y="-7" width="10" height="10" rx="2" fill="#2ea043" stroke="#39d353" stroke-width="0.5" />
        <rect x="-55" y="-7" width="10" height="10" rx="2" fill="#56d364" stroke="#7ee787" stroke-width="0.5" />
        <text x="-10" y="0" fill="#8b949e" class="font-mono" font-size="8.5" letter-spacing="1">More</text>
      </g>

      <!-- Month Labels -->
      <g transform="translate(105, 128)" fill="#8b949e" class="font-mono" font-size="9" font-weight="600">
        ${monthTexts}
      </g>

      <!-- Day Labels on left -->
      <g transform="translate(65, 176)" fill="#8b949e" class="font-mono" font-size="8.5" font-weight="600">
        <text x="0" y="19">Mon</text>
        <text x="0" y="57">Wed</text>
        <text x="0" y="95">Fri</text>
      </g>

      <!-- Heatmap Cells Matrix (53 Columns x 7 Rows) -->
      <g id="heatmapGrid">
        ${gridRects}
      </g>

      <!-- ====================================================== -->
      <!-- MULTI-SEGMENT AUTONOMOUS SNAKE                         -->
      <!-- ====================================================== -->
      <!-- Snake Tail Segment 7 -->
      <g>
        <animateMotion dur="24s" repeatCount="indefinite" begin="-22.95s" keyPoints="0;1" keyTimes="0;1" rotate="auto">
          <mpath xlink:href="#masterSnakePath" />
        </animateMotion>
        <rect x="-4.5" y="-4.5" width="9" height="9" rx="2" fill="#10b981" opacity="0.65" />
      </g>

      <!-- Snake Body Segment 6 -->
      <g>
        <animateMotion dur="24s" repeatCount="indefinite" begin="-23.10s" keyPoints="0;1" keyTimes="0;1" rotate="auto">
          <mpath xlink:href="#masterSnakePath" />
        </animateMotion>
        <rect x="-5" y="-5" width="10" height="10" rx="2" fill="#10b981" opacity="0.8" />
      </g>

      <!-- Snake Body Segment 5 -->
      <g>
        <animateMotion dur="24s" repeatCount="indefinite" begin="-23.25s" keyPoints="0;1" keyTimes="0;1" rotate="auto">
          <mpath xlink:href="#masterSnakePath" />
        </animateMotion>
        <rect x="-5.5" y="-5.5" width="11" height="11" rx="2.5" fill="#06b6d4" opacity="0.9" />
      </g>

      <!-- Snake Body Segment 4 -->
      <g>
        <animateMotion dur="24s" repeatCount="indefinite" begin="-23.40s" keyPoints="0;1" keyTimes="0;1" rotate="auto">
          <mpath xlink:href="#masterSnakePath" />
        </animateMotion>
        <rect x="-6" y="-6" width="12" height="12" rx="2.5" fill="#06b6d4" />
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
    </g>

    <!-- Outer Border Line -->
    <rect x="1" y="1" width="1198" height="348" rx="13" fill="none" stroke="#30363d" stroke-width="1" />
  </g>
</svg>
`;

  fs.writeFileSync(TARGET_SVG_PATH, svgContent, 'utf8');
  console.log(`Successfully generated dynamic snake SVG at ${TARGET_SVG_PATH}`);
}

generate().catch(err => {
  console.error('Fatal error during snake generation:', err);
  process.exit(1);
});
