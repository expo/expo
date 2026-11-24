// Usage: node parity/serve.mjs <directory> <port>
// A static file server. It serves `index.html` for a directory and `404.html` for a missing file.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
const [root, port] = process.argv.slice(2);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
};
http
  .createServer((req, res) => {
    let pathname = decodeURIComponent(new URL(req.url, 'http://n').pathname);
    let file = path.join(root, pathname);
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    let stat = fs.statSync(file, { throwIfNoEntry: false });
    if (stat?.isDirectory()) {
      file = path.join(file, 'index.html');
      stat = fs.statSync(file, { throwIfNoEntry: false });
    }
    let status = 200;
    if (!stat?.isFile()) {
      file = path.join(root, '404.html');
      stat = fs.statSync(file, { throwIfNoEntry: false });
      status = 404;
      if (!stat) {
        res.writeHead(404).end('not found');
        return;
      }
    }
    const type = TYPES[path.extname(file)] ?? 'application/octet-stream';
    const range = status === 200 && req.headers.range?.match(/bytes=(\d+)-(\d*)/);
    if (range) {
      const start = Number(range[1]),
        end = range[2] ? Number(range[2]) : stat.size - 1;
      res.writeHead(206, {
        'content-type': type,
        'content-range': `bytes ${start}-${end}/${stat.size}`,
        'content-length': end - start + 1,
        'accept-ranges': 'bytes',
      });
      fs.createReadStream(file, { start, end }).pipe(res);
      return;
    }
    res.writeHead(status, {
      'content-type': type,
      'content-length': stat.size,
      'accept-ranges': 'bytes',
      'cache-control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(Number(port), '127.0.0.1', () => console.log(`serving ${root} on ${port}`));
