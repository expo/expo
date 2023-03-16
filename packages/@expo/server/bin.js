#!/usr/bin/env node

const path = require('path');
const { createRequestHandler } = require('@expo/server/build/vendor/express');

const express = require('express');
const compression = require('compression');
const morgan = require('morgan');

const BUILD_DIR = path.join(process.cwd(), 'dist');

const app = express();

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(BUILD_DIR, { maxAge: '1h' }));
} else {
  app.use(express.static('public', { maxAge: '1h' }));
}

app.use(morgan('tiny'));

app.all(
  '*',
  process.env.NODE_ENV === 'development'
    ? (req, res, next) => {
        purgeRequireCache();
        return createRequestHandler({
          build: BUILD_DIR,
        })(req, res, next);
      }
    : createRequestHandler({
        build: BUILD_DIR,
      })
);
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});

function purgeRequireCache() {
  // purge require cache on requests for "server side HMR" this won't let
  // you have in-memory objects between requests in development,
  // alternatively you can set up nodemon/pm2-dev to restart the server on
  // file changes, but then you'll have to reconnect to databases/etc on each
  // change. We prefer the DX of this, so we've included it for you by default
  for (const key in require.cache) {
    if (key.startsWith(BUILD_DIR)) {
      delete require.cache[key];
    }
  }
}
