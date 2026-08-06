// Lightweight static file server for SunnahPath
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = '/home/z/my-project/out';
const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain',
  '.xml': 'text/xml',
};

const server = createServer(async (req, res) => {
  let path = join(__dirname, req.url === '/' ? 'index.html' : req.url);

  try {
    const s = await stat(path);
    if (s.isDirectory()) path = join(path, 'index.html');
  } catch {
    // Try .html extension for SPA routing
    path = join(__dirname, req.url + '.html');
  }

  try {
    const data = await readFile(path);
    const mime = MIME_TYPES[extname(path)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  } catch {
    // 404 - serve index.html for SPA
    try {
      const data = await readFile(join(__dirname, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not Found');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`SunnahPath server running at http://localhost:${PORT}`);
});
