#!/usr/bin/env yarn --silent ts-node --transpile-only

const Server = require('./server').Server;
const Update = require('./update').Update;
const delay = require('timers/promises').setTimeout;

const runAsync = async () => {
  Server.start(Update.serverPort);
  console.log('Updates server started');
  while (Server.isStarted()) {
    await delay(1000);
  }
  console.log('Updates server stopped');
  process.exit(0);
};

runAsync();
