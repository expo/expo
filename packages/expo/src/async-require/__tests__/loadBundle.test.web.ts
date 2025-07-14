import { DeviceEventEmitter } from 'react-native';

import { fetchThenEvalAsync } from '../fetchThenEval';
import HMRClient from '../hmr';
import { loadBundleAsync } from '../loadBundle';

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
  DeviceEventEmitter.emit = jest.fn();
  process.env.NODE_ENV = 'development';
  await loadBundleAsync('/Second.bundle?modulesOnly=true');

  expect(DeviceEventEmitter.emit).not.toHaveBeenCalled();
  expect(DeviceEventEmitter.emit).not.toHaveBeenCalled();

  const url = `/Second.bundle?modulesOnly=true`;
  expect(HMRClient.registerBundle).toHaveBeenCalledWith(url);
  expect(fetchThenEvalAsync).toHaveBeenCalledWith(url);
});
it('loads a bundle in production', async () => {
  DeviceEventEmitter.emit = jest.fn();
  process.env.NODE_ENV = 'production';
  await loadBundleAsync('/Second.bundle?modulesOnly=true');
  expect(DeviceEventEmitter.emit).not.toHaveBeenCalled();
  expect(DeviceEventEmitter.emit).not.toHaveBeenCalled();

  const url = `/Second.bundle?modulesOnly=true`;
  expect(HMRClient.registerBundle).not.toHaveBeenCalled();
  expect(fetchThenEvalAsync).toHaveBeenCalledWith(url);
});
