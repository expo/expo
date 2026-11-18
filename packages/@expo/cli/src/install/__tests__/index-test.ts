import { expoInstall } from '../index';

jest.mock('../../utils/interactive', () => ({ isInteractive: () => true }));
jest.mock('../../utils/findUp', () => ({
  findUpProjectRootOrAssert: jest.fn(() => '/app'),
}));
jest.mock('../../utils/nodeEnv', () => ({ loadEnvFiles: jest.fn() }));
jest.mock('../../utils/errors', () => ({ logCmdError: jest.fn() }));
jest.mock('../installAsync', () => ({ installAsync: jest.fn(async () => {}) }));
jest.mock('../resolveOptions', () => ({
  resolveArgsAsync: jest.fn(async () => ({
    variadic: [],
    options: {},
    extras: [],
  })),
}));

const { loadEnvFiles } = require('../../utils/nodeEnv') as {
  loadEnvFiles: jest.Mock;
};
const { installAsync } = require('../installAsync') as {
  installAsync: jest.Mock;
};

it('loads development env files before install', async () => {
  await expoInstall([]);

  expect(loadEnvFiles).toHaveBeenCalledWith('/app', { mode: 'development' });
  expect(loadEnvFiles.mock.invocationCallOrder[0]).toBeLessThan(
    installAsync.mock.invocationCallOrder[0]!
  );
  expect(installAsync).toHaveBeenCalledWith([], { projectRoot: '/app' }, []);
});

describe('program status', () => {
  let write: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    write.mockRestore();
  });

  it('reports done after installing packages', async () => {
    const { withProgramStatus } =
      require('../../utils/programStatus') as typeof import('../../utils/programStatus');
    (require('../installAsync') as { installAsync: jest.Mock }).installAsync.mockImplementation(
      () => withProgramStatus({ state: 'working' }, async () => {})
    );

    await (require('../index') as typeof import('../index')).expoInstall([]);

    expect(write.mock.calls.at(-1)).toEqual([
      '\x1b]7501;state=done:app=expo:msg=SW5zdGFsbGVkIHBhY2thZ2Vz\x1b\\',
    ]);
  });

  it('reports nothing if installing packages never reported working', async () => {
    (require('../installAsync') as { installAsync: jest.Mock }).installAsync.mockResolvedValue(
      undefined
    );

    await (require('../index') as typeof import('../index')).expoInstall([]);

    expect(write).not.toHaveBeenCalled();
  });
});
