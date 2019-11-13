const { parse } = require('url');
const next = require('next');
const { createServer } = require('http');
const app = next({ dev: true });
const port = 3000;
const handle = app.getRequestHandler();
const localtunnel = require('localtunnel');

let tunnelUrl;

app.prepare().then(() => {
  createServer((req, res) => {
    // Enable CORS in development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const { pathname, query } = parse(req.url, true);
    if (pathname === '/' || pathname.startsWith('/static') || pathname.startsWith('/_next')) {
      handle(req, res);
    } else if (pathname.endsWith('/')) {
      // If we have a tunnel URL then pass it through headers
      req.headers['Expo-Documentation-Tunnel-URL'] = tunnelUrl;

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

    console.log(
      `Next.js server started at http://localhost:${port}, but the tunnel connection is required for testing Snack links.`
    );
    console.log('Starting tunnel...');
    localtunnel({ port })
      .then(tunnel => {
        tunnelUrl = tunnel.url;
        console.log(`Tunnel started. No need to know the URL - it is only for Snack links.`);
      })
      // eslint-disable-next-line handle-callback-err
      .catch(err => {
        console.log(`Unable to start tunnel for some reason. Snack template links will not work.`);
      });
  });
});
