const os = jest.requireActual('os');

// A copy, not a mutation: overwriting the actual module's properties would poison
// `jest.requireActual('os')` for every test that needs the real tmpdir (observed on
// the Windows runner, where the lock tests must create real directories).
module.exports = {
  ...os,
  homedir: jest.fn(() => '/home'),
  tmpdir: jest.fn(() => '/tmp'),
};
