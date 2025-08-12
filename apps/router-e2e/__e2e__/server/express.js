#!/usr/bin/env node

const path = require('path');
const { createRequestHandler } = require('@expo/server/adapter/express');

const express = require('express');
const compression = require('compression');
const morgan = require('morgan');

// eslint-disable-next-line no-undef
const CLIENT_BUILD_DIR = path.join(__dirname, '../../dist-server-express/client');
// eslint-disable-next-line no-undef
const SERVER_BUILD_DIR = path.join(__dirname, '../../dist-server-express/server');

const app = express();

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

process.env.NODE_ENV = 'production';

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
    {
      build: SERVER_BUILD_DIR,
    },
    {
      beforeResponse: (response, route) => {
        response.headers['custom-all-type'] = route.type ?? 'unknown';
        response.headers['custom-all-route'] = route.page ?? 'unknown';
        return response;
      },
      beforeErrorResponse: (response, route) => {
        response.headers['custom-error-type'] = route.type ?? 'unknown';
        response.headers['custom-error-route'] = route.page ?? 'unknown';
        return response;
      },
      beforeAPIResponse(response, route) {
        response.headers['custom-api-type'] = route.type ?? 'unknown';
        response.headers['custom-api-route'] = route.page ?? 'unknown';
        return response;
      },
      beforeHTMLResponse(response, route) {
        response.headers['custom-html-type'] = route.type ?? 'unknown';
        response.headers['custom-html-route'] = route.page ?? 'unknown';
        return response;
      },
    }
  )
);
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});
