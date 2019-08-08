const { parse } = require('url');
const next = require('next');
const { createServer } = require('http');
const app = next({ dev: true });
const port = 3000;
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const { pathname, query } = parse(req.url, true);
    if (pathname === '/' || pathname.startsWith('/static') || pathname.startsWith('/_next')) {
      handle(req, res);
    } else if (pathname.endsWith('/')) {
      // Respond to `foo/`, matching production behavior
      // (If next could be configured to do this we could delete this entire file)
      app.render(req, res, pathname.slice(0, -1), query);
    } else {
      // 404 for page `foo` even if `foo/` exists to notice link mistakes more easily in dev
      app.render404(req, res);
    }
  }).listen(port, err => {
    if (err) {
      throw err;
    }

    console.log(`The documentation server is running on http://localhost:${port}`);
  });
});
