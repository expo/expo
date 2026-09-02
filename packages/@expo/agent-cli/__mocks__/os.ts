const os = jest.requireActual('os');
const fs = jest.requireActual('fs');
const path = require('path');

// A copy, not a mutation: overwriting the actual module's properties would poison
// `jest.requireActual('os')` for every test that needs the real tmpdir (observed on
// the Windows runner, where the lock tests must create real directories).
//
// POSIX paths stay POSIX so Darwin/Linux assertions stay stable. Windows cannot mkdir
// `/tmp`, so those two answers are real directories under the runner's temp folder.
function existingDir(posixPath, winName) {
  if (process.platform !== 'win32') {
    return posixPath;
  }
  const dir = path.join(os.tmpdir(), winName);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

module.exports = {
  ...os,
  homedir: jest.fn(() => existingDir('/home', 'agent-cli-mock-home')),
  tmpdir: jest.fn(() => existingDir('/tmp', 'agent-cli-mock-tmp')),
};
