"use strict";

const child_process = require("child_process");
const os = require("os").platform();

let selectiveCmdify = cmd => cmd;
if (os === "win32") {
  selectiveCmdify = cmd => cmd + ".cmd";
}

module.exports = function spawnSync(cmd, args, options) {
  cmd = selectiveCmdify(cmd);
  if (!Array.isArray(args)) {
    args = [args];
  }

  return child_process.spawnSync(cmd, args, options);
};
