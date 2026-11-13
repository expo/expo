import { expoPrebuild } from '../index';

jest.mock('../../utils/args', () => ({
  assertArgs: jest.fn(() => ({ '--help': false })),
  getProjectRoot: jest.fn(() => '/app'),
  printHelp: jest.fn(),
}));
jest.mock('../../utils/nodeEnv', () => ({
  getConfigEnvMode: jest.fn(() => 'development'),
  loadEnvFiles: jest.fn(),
}));
jest.mock('../../utils/errors', () => ({ logCmdError: jest.fn() }));
jest.mock('../../utils/interactive', () => ({
  isInteractive: jest.fn(() => false),
}));
jest.mock('../prebuildAsync.js', () => ({ prebuildAsync: jest.fn(async () => {}) }), {
  virtual: true,
});
jest.mock(
  '../resolveOptions.js',
  () => ({
    resolvePackageManagerOptions: jest.fn(() => ({})),
    resolvePlatformOption: jest.fn(() => ['android']),
    resolveSkipDependencyUpdate: jest.fn(() => []),
  }),
  { virtual: true }
);

const { loadEnvFiles } = require('../../utils/nodeEnv') as {
  loadEnvFiles: jest.Mock;
};
const { getConfigEnvMode } = require('../../utils/nodeEnv') as {
  getConfigEnvMode: jest.Mock;
};
const { prebuildAsync } = require('../prebuildAsync.js') as {
  prebuildAsync: jest.Mock;
};
const { isInteractive } = require('../../utils/interactive') as {
  isInteractive: jest.Mock;
};

beforeEach(() => {
  getConfigEnvMode.mockReturnValue('development');
});

it('loads development env files before prebuild', async () => {
  await expoPrebuild([]);

  expect(loadEnvFiles).toHaveBeenCalledWith('/app', { mode: 'development' });
  expect(loadEnvFiles.mock.invocationCallOrder[0]).toBeLessThan(
    prebuildAsync.mock.invocationCallOrder[0]!
  );
});

it('uses the production mode from __EXPO_CONFIG_MODE', async () => {
  getConfigEnvMode.mockReturnValue('production');

  await expoPrebuild([]);

  expect(loadEnvFiles).toHaveBeenCalledWith('/app', { mode: 'production' });
});

it('reports working while prebuilding and done after', async () => {
  const write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  let writesWhilePrebuilding: unknown[][] = [];
  isInteractive.mockReturnValue(true);
  prebuildAsync.mockImplementationOnce(async () => {
    writesWhilePrebuilding = [...write.mock.calls];
    return {};
  });

  try {
    await expoPrebuild([]);

    expect(writesWhilePrebuilding).toEqual([
      ['\x1b]7501;state=working:app=expo:msg=UnVubmluZyBwcmVidWlsZA==:id=3\x1b\\'],
    ]);
    expect(write.mock.calls).toEqual([
      ['\x1b]7501;state=working:app=expo:msg=UnVubmluZyBwcmVidWlsZA==:id=3\x1b\\'],
      ['\x1b]7501;state=clear:id=3\x1b\\'],
      ['\x1b]7501;state=done:app=expo:msg=RmluaXNoZWQgcHJlYnVpbGQ=\x1b\\'],
    ]);
  } finally {
    write.mockRestore();
    isInteractive.mockReturnValue(false);
  }
});

it('reports no done when a guard is declined', async () => {
  const write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  isInteractive.mockReturnValue(true);
  prebuildAsync.mockResolvedValueOnce(null);

  try {
    await expoPrebuild([]);

    expect(write.mock.calls).toEqual([
      ['\x1b]7501;state=working:app=expo:msg=UnVubmluZyBwcmVidWlsZA==:id=4\x1b\\'],
      ['\x1b]7501;state=clear:id=4\x1b\\'],
    ]);
  } finally {
    write.mockRestore();
    isInteractive.mockReturnValue(false);
  }
});
