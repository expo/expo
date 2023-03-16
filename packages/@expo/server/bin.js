#!/usr/bin/env node

const path = require('path');
const { createRequestHandler } = require('@expo/server');
const http = require('http');

const handler = createRequestHandler(path.join(process.cwd(), 'dist'));

// Start a basic server on port 3000
const server = http.createServer();
server.listen(3000, () => {
  console.log('Server listening on port 3000');
});

// // add handler middleware

server.on('request', handler);
