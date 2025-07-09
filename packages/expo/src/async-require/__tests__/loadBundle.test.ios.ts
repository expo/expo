import { fetchThenEvalAsync } from '../fetchThenEval';
import HMRClient from '../hmr';
import { loadBundleAsync } from '../loadBundle';

jest.mock('../getDevServer');

jest.mock('../fetchThenEval', () => ({
  fetchThenEvalAsync: jest.fn(async (): Promise<void> => {}),
}));

jest.mock('../hmr', () => ({
  __esModule: true,
  default: { registerBundle: jest.fn() },
}));

const originalEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalEnv;

  if (typeof location !== 'undefined') {
    delete (global as any).location;
  }
});

it('loads a bundle', async () => {
  process.env.NODE_ENV = 'development';
  await loadBundleAsync(
    'Second.bundle?platform=ios&modulesOnly=true&runModule=false&runtimeBytecodeVersion='
  );
  const url =
    'http://localhost:19000/Second.bundle?platform=ios&modulesOnly=true&runModule=false&runtimeBytecodeVersion=';
  expect(HMRClient.registerBundle).toHaveBeenCalledWith(url);
  expect(fetchThenEvalAsync).toHaveBeenCalledWith(url);
});

it('asserts in production when attempting to load a bundle and the user-defined origin is missing.', async () => {
  process.env.NODE_ENV = 'production';

  await expect(
    loadBundleAsync(
      'Second.bundle?platform=ios&modulesOnly=true&runModule=false&runtimeBytecodeVersion='
    )
  ).rejects.toThrow();
  expect(HMRClient.registerBundle).not.toBeCalled();
  expect(fetchThenEvalAsync).not.toBeCalled();
});

it('loads a bundle in production with user-defined location.origin', async () => {
  process.env.NODE_ENV = 'production';

  (global as any).location = {
    origin: 'https://example.com',
  };

  await loadBundleAsync('/_expo/js/index.bundle');
  const url = 'https://example.com/_expo/js/index.bundle';
  expect(HMRClient.registerBundle).not.toHaveBeenCalled();
  expect(fetchThenEvalAsync).toHaveBeenCalledWith(url);
});
