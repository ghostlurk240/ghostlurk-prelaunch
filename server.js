// Tiny static server for Railway. No dependencies. Listens on Railway's PORT variable.
// Serves only the site files (index.html, icons, assets/), never CLAUDE.md or repo files.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8080;
const PUBLIC = new Set(['/index.html', '/icon.png', '/apple-icon.png']);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    pathname = '';
  }
  if (pathname === '/') pathname = '/index.html';
  const file = path.join(ROOT, path.normalize(pathname));
  const allowed = PUBLIC.has(pathname) || file.startsWith(path.join(ROOT, 'assets') + path.sep);
  const type = TYPES[path.extname(file)];

  if ((req.method !== 'GET' && req.method !== 'HEAD') || !allowed || !type) return notFound(res);
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return notFound(res);
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': stat.size,
      // Page, styles and scripts are rechecked every visit so a push shows up at once.
      'Cache-Control': /\.(html|css|js)$/.test(file) ? 'no-cache' : 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}).listen(PORT, '::', () => console.log(`Ghostlurk teaser listening on port ${PORT}`));

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}
