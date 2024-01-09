"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.applyPatchAsync = applyPatchAsync;
exports.getPatchChangedLinesAsync = getPatchChangedLinesAsync;
function _spawnAsync() {
  const data = _interopRequireDefault(require("@expo/spawn-async"));
  _spawnAsync = function () {
    return data;
  };
  return data;
}
function _getenv() {
  const data = require("getenv");
  _getenv = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const EXPO_DEBUG = (0, _getenv().boolish)('EXPO_DEBUG', false);
async function applyPatchAsync(projectRoot, patchFilePath) {
  return await runGitAsync(['apply', patchFilePath], {
    cwd: projectRoot
  });
}
async function getPatchChangedLinesAsync(patchFilePath) {
  const stdout = await runGitAsync(['apply', '--numstat', patchFilePath]);
  const lines = stdout.split(/\r?\n/);
  let changedLines = 0;
  for (const line of lines) {
    if (line === '') {
      continue;
    }
    const [added, deleted] = line.split('\t', 2);
    changedLines += Number(added) + Number(deleted);
  }
  return changedLines;
}
async function runGitAsync(args, options) {
  try {
    const {
      stdout,
      stderr
    } = await (0, _spawnAsync().default)('git', args, options);
    if (EXPO_DEBUG) {
      console.log(`Running \`git ${args}\` outputs:\nstdout:\n${stdout}\nstderr:\n${stderr}`);
    }
    return stdout;
  } catch (e) {
    if (e.code === 'ENOENT') {
      e.message += `\nGit is required to apply patches. Install Git and try again.`;
    } else if (e.stderr) {
      e.message += `\nstderr:\n${e.stderr}`;
    }
    throw e;
  }
}
//# sourceMappingURL=gitPatch.js.map