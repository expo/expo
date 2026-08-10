import { expoInstall } from '../index';

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
