#!/usr/bin/env node
const compression = require('compression');
const { createRequestHandler } = require('expo-server/adapter/express');
const express = require('express');
const morgan = require('morgan');
const path = require('node:path');

const [, , distArg = 'dist'] = process.argv;
const DIST_DIR = path.resolve(process.cwd(), distArg);
const CLIENT_BUILD_DIR = path.join(DIST_DIR, 'client');
const SERVER_BUILD_DIR = path.join(DIST_DIR, 'server');

process.env.NODE_ENV = 'production';

const app = express();

app.use(compression());
app.disable('x-powered-by');

app.use(
  express.static(CLIENT_BUILD_DIR, {
    maxAge: '1h',
    extensions: ['html'],
  })
);

app.use(morgan('tiny'));

app.all(
  '/{*all}',
  createRequestHandler(
    { build: SERVER_BUILD_DIR },
    {
      beforeResponse: (response, route) => {
        response.headers.set('custom-all-type', route.type ?? 'unknown');
        response.headers.set('custom-all-route', route.page ?? 'unknown');
        return response;
      },
      beforeErrorResponse: (response, route) => {
        response.headers.set('custom-error-type', route.type ?? 'unknown');
        response.headers.set('custom-error-route', route.page ?? 'unknown');
        return response;
      },
      beforeAPIResponse(response, route) {
        response.headers.set('custom-api-type', route.type ?? 'unknown');
        response.headers.set('custom-api-route', route.page ?? 'unknown');
        return response;
      },
      beforeHTMLResponse(response, route) {
        response.headers.set('custom-html-type', route.type ?? 'unknown');
        response.headers.set('custom-html-route', route.page ?? 'unknown');
        return response;
      },
    }
  )
);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});
