#!/usr/bin/env node

const path = require('path');
const { createRequestHandler } = require('@expo/server/build/vendor/express');

const express = require('express');
const compression = require('compression');
const morgan = require('morgan');

const args = process.argv.slice(2);
const distDirectoryArg = args.find((arg) => arg.startsWith('--dist='));
const distDirectory = distDirectoryArg ? distDirectoryArg.split('=')[1] : 'dist';

const portArg = args.find((arg) => arg.startsWith('--port='));
const port = portArg ? portArg.split('=')[1] : process.env.PORT || 3000;

const CLIENT_BUILD_DIR = path.join(process.cwd(), distDirectory, 'client');
const SERVER_BUILD_DIR = path.join(process.cwd(), distDirectory, 'server');

const app = express();

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

process.env.NODE_ENV = 'production';

require('@expo/env').load(__dirname);

app.use(
  express.static(CLIENT_BUILD_DIR, {
    maxAge: '1h',
    extensions: ['html'],
  })
);
app.use(morgan('tiny'));

app.all(
  '*',
  createRequestHandler({
    build: SERVER_BUILD_DIR,
  })
);

app.listen(port, () => {
  console.log(`Accepting connections at http://localhost:${port}`);
});
