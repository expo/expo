import HMRClient from '../../HMRClient';
import LoadingView from '../../LoadingView';
import { fetchThenEvalAsync } from '../fetchThenEval';
import { loadBundleAsync } from '../loadBundle';

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
  expect(LoadingView.showMessage).not.toBeCalled();
  expect(LoadingView.hide).not.toBeCalled();
  const url = `/Second.bundle?modulesOnly=true`;
  expect(HMRClient.registerBundle).toBeCalledWith(url);
  expect(fetchThenEvalAsync).toBeCalledWith(url);
});
it('loads a bundle in production', async () => {
  process.env.NODE_ENV = 'production';
  await loadBundleAsync('/Second.bundle?modulesOnly=true');
  expect(LoadingView.showMessage).not.toBeCalled();
  expect(LoadingView.hide).not.toBeCalled();
  const url = `/Second.bundle?modulesOnly=true`;
  expect(HMRClient.registerBundle).not.toBeCalled();
  expect(fetchThenEvalAsync).toBeCalledWith(url);
});
