//node map-dir.js to access

const fs = require('fs');
const path = require('path');

const ignoreFolders = ['node_modules', '.git', '.next', '.vercel', 'dist'];

function printTree(dir, depth = 0) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    if (ignoreFolders.includes(file)) return;
    
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    const spacing = '  '.repeat(depth);
    
    if (stats.isDirectory()) {
      console.log(`${spacing}📁 ${file}/`);
      printTree(filePath, depth + 1);
    } else {
      console.log(`${spacing}📄 ${file}`);
    }
  });
}

console.log("--- PROJECT STRUCTURE ---");
printTree(process.cwd());