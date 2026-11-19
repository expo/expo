import { lanNetwork, lanNetworkSync } from 'lan-network';

import { getGateway, getGatewayAsync, getIpAddressAsync, resetGatewayCache } from '../ip';

jest.mock('lan-network', () => ({ lanNetwork: jest.fn(), lanNetworkSync: jest.fn() }));

const gateway = {
  iname: 'test0',
  address: '192.168.4.2',
  gateway: '192.168.4.1',
  internal: false,
  netmask: '255.255.255.0',
  family: 'IPv4' as const,
  mac: '00:00:00:00:00:00',
  cidr: '192.168.4.2/24',
};
const nextGateway = { ...gateway, address: '192.168.5.2' };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  jest.mocked(lanNetwork).mockReset().mockResolvedValue(gateway);
  jest.mocked(lanNetworkSync).mockReset().mockReturnValue(gateway);
});
afterEach(() => resetGatewayCache());

it('shares concurrent discovery and the result across getters', async () => {
  const [first, second] = await Promise.all([getGatewayAsync(), getGatewayAsync()]);
  expect(first).toBe(gateway);
  expect(second).toBe(first);
  expect(await getIpAddressAsync()).toBe(gateway.address);
  expect(getGateway()).toBe(first);
  expect(lanNetwork).toHaveBeenCalledTimes(1);
  expect(lanNetworkSync).not.toHaveBeenCalled();
});

it('shares synchronous discovery with asynchronous callers', async () => {
  expect(getGateway()).toBe(gateway);
  expect(await getGatewayAsync()).toBe(gateway);
  expect(getGateway()).toBe(gateway);
  expect(lanNetworkSync).toHaveBeenCalledTimes(1);
  expect(lanNetwork).not.toHaveBeenCalled();
});

it('discovers again after a reset', async () => {
  await getGatewayAsync();
  resetGatewayCache();
  jest.mocked(lanNetwork).mockResolvedValueOnce(nextGateway);
  expect(await getGatewayAsync()).toBe(nextGateway);
  expect(lanNetwork).toHaveBeenCalledTimes(2);
});

it('does not let a pre-reset discovery replace the new result', async () => {
  const old = deferred<typeof gateway>();
  jest.mocked(lanNetwork).mockReturnValueOnce(old.promise);
  const pending = getGatewayAsync();
  await Promise.resolve();
  resetGatewayCache();
  jest.mocked(lanNetwork).mockResolvedValueOnce(nextGateway);
  await getGatewayAsync();
  old.resolve(gateway);
  await pending;
  expect(await getGatewayAsync()).toBe(nextGateway);
  expect(getGateway()).toBe(nextGateway);
});

it('does not let a pre-reset failure clear the new pending discovery', async () => {
  const old = deferred<typeof gateway>();
  const current = deferred<typeof gateway>();
  jest.mocked(lanNetwork).mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
  const pendingOld = getGatewayAsync();
  await Promise.resolve();
  resetGatewayCache();
  const pendingCurrent = getGatewayAsync();
  old.reject(new Error('old discovery failed'));
  await pendingOld;
  const shared = getGatewayAsync();
  current.resolve(nextGateway);
  expect(await shared).toBe(nextGateway);
  await pendingCurrent;
  expect(lanNetwork).toHaveBeenCalledTimes(2);
});

it('retries asynchronous discovery after returning the fallback', async () => {
  jest.mocked(lanNetwork).mockRejectedValueOnce(new Error('offline'));
  expect((await getGatewayAsync()).address).toBe('127.0.0.1');
  expect(await getGatewayAsync()).toBe(gateway);
  expect(await getGatewayAsync()).toBe(gateway);
  expect(lanNetwork).toHaveBeenCalledTimes(2);
});

it('retries synchronous discovery after returning the fallback', () => {
  jest.mocked(lanNetworkSync).mockImplementationOnce(() => {
    throw new Error('offline');
  });
  expect(getGateway().address).toBe('127.0.0.1');
  expect(getGateway()).toBe(gateway);
  expect(getGateway()).toBe(gateway);
  expect(lanNetworkSync).toHaveBeenCalledTimes(2);
});

it('does not overwrite a synchronous result with an older asynchronous discovery', async () => {
  const old = deferred<typeof gateway>();
  jest.mocked(lanNetwork).mockReturnValueOnce(old.promise);
  const pending = getGatewayAsync();
  await Promise.resolve();
  jest.mocked(lanNetworkSync).mockReturnValueOnce(nextGateway);
  expect(getGateway()).toBe(nextGateway);
  old.resolve(gateway);
  await pending;
  expect(await getGatewayAsync()).toBe(nextGateway);
});
