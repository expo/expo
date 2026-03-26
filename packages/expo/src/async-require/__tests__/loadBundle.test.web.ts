import * as devLoadingViewEmitter from '../../devLoadingViewEmitter';
import { fetchThenEvalAsync } from '../fetchThenEval';
import HMRClient from '../hmr';
import { loadBundleAsync } from '../loadBundle';

jest.mock('../../devLoadingViewEmitter', () => ({
  emit: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('../fetchThenEval', () => ({
  fetchThenEvalAsync: jest.fn(async () => {}),
}));

jest.mock('../hmr', () => ({
  __esModule: true,
  default: { registerBundle: jest.fn() },
}));

const originalEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalEnv;
});

it('loads a bundle', async () => {
  process.env.NODE_ENV = 'development';
  await loadBundleAsync('/Second.bundle?modulesOnly=true');

  expect(devLoadingViewEmitter.emit).not.toHaveBeenCalled();

  expect(HMRClient.registerBundle).toHaveBeenCalledWith(
    expect.stringMatching(/Second.bundle\?modulesOnly=true$/)
  );
  expect(fetchThenEvalAsync).toHaveBeenCalledWith(
    expect.stringMatching(/Second.bundle\?modulesOnly=true$/)
  );
});
it('loads a bundle in production', async () => {
  process.env.NODE_ENV = 'production';
  await loadBundleAsync('/Second.bundle?modulesOnly=true');
  expect(devLoadingViewEmitter.emit).not.toHaveBeenCalled();

  expect(HMRClient.registerBundle).not.toHaveBeenCalled();
  expect(fetchThenEvalAsync).toHaveBeenCalledWith(
    expect.stringMatching(/Second.bundle\?modulesOnly=true$/)
  );
});
