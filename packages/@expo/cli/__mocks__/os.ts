module.exports = {
  ...jest.requireActual<typeof import('os')>('os'),
  homedir: jest.fn(() => '/home'),
  tmpdir: jest.fn(() => '/tmp'),
};
