'use strict';

const child_process = require('child_process');
const os = require('os').platform();

module.exports = function spawnSync(cmd, args, options) {
  cmd = os === 'win32' ? cmd + '.cmd' : cmd;

  return child_process.spawnSync(cmd, args, options);
};
