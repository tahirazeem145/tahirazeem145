const fs = require('fs');

const svg = fs.readFileSync('contribution-snake.svg', 'utf8');

const regex = /<rect x="(\d+)" y="(\d+)" width="15" height="15" rx="3" fill="([^"]+)"/g;
let m;
const activeByX = {};
const colors = {};
while ((m = regex.exec(svg)) !== null) {
  const x = parseInt(m[1]);
  const fill = m[3];
  colors[fill] = (colors[fill] || 0) + 1;
  if (fill !== '#161b22') {
    activeByX[x] = (activeByX[x] || 0) + 1;
  }
}

console.log('Colors:', colors);
console.log('Active by X:');
console.table(activeByX);
