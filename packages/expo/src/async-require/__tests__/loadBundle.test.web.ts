import { DeviceEventEmitter } from 'react-native-web';

import { fetchThenEvalAsync } from '../fetchThenEval';
import HMRClient from '../hmr';
import { loadBundleAsync } from '../loadBundle';

jest.mock('react-native-web', () => {
  const og = jest.requireActual('react-native-web');
  return {
    ...og,
    DeviceEventEmitter: {
      emit: jest.fn(),
    },
  };
});

jest.mock('../fetchThenEval', () => ({
  fetchThenEvalAsync: jest.fn(async () => {}),
}));

jest.mock('../../HMRClient', () => ({
  __esModule: true,
  default: { registerBundle: jest.fn() },
}));

jest.mock('../../LoadingView');

const originalEnv = process.env.NODE_ENV;
afterEach(() => {
  process.env.NODE_ENV = originalEnv;
});

it('loads a bundle', async () => {
  process.env.NODE_ENV = 'development';
  await loadBundleAsync('/Second.bundle?modulesOnly=true');

  expect(DeviceEventEmitter.emit).not.toBeCalled();
  expect(DeviceEventEmitter.emit).not.toBeCalled();

  const url = `/Second.bundle?modulesOnly=true`;
  expect(HMRClient.registerBundle).toBeCalledWith(url);
  expect(fetchThenEvalAsync).toBeCalledWith(url);
});
it('loads a bundle in production', async () => {
  process.env.NODE_ENV = 'production';
  await loadBundleAsync('/Second.bundle?modulesOnly=true');
  expect(DeviceEventEmitter.emit).not.toBeCalled();
  expect(DeviceEventEmitter.emit).not.toBeCalled();

  const url = `/Second.bundle?modulesOnly=true`;
  expect(HMRClient.registerBundle).not.toBeCalled();
  expect(fetchThenEvalAsync).toBeCalledWith(url);
});
