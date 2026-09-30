import type { getDevicePushTokenAsync as GetDevicePushTokenAsync } from '../getDevicePushTokenAsync';

jest.mock('../PushTokenManager', () => ({
  getDevicePushTokenAsync: mockNativeRequest,
}));
jest.mock('../warnOfExpoGoPushUsage', () => ({
  warnOfExpoGoPushUsage: jest.fn(),
}));

const mockNativeRequest = jest.fn<Promise<string>, []>();
let getDevicePushTokenAsync: typeof GetDevicePushTokenAsync;

beforeEach(() => {
  jest.resetModules();
  mockNativeRequest.mockReset();
  getDevicePushTokenAsync = require('../getDevicePushTokenAsync').getDevicePushTokenAsync;
});

it('retries the native request after a rejection', async () => {
  mockNativeRequest
    .mockRejectedValueOnce(new Error('temporary failure'))
    .mockResolvedValueOnce('token');
  await expect(getDevicePushTokenAsync()).rejects.toThrow('temporary failure');
  await expect(getDevicePushTokenAsync()).resolves.toEqual({
    type: 'ios',
    data: 'token',
  });
  expect(mockNativeRequest).toHaveBeenCalledTimes(2);
});

it('shares a pending request between concurrent callers', async () => {
  let rejectRequest!: (error: Error) => void;
  mockNativeRequest.mockImplementationOnce(
    () =>
      new Promise<string>((_resolve, reject) => {
        rejectRequest = reject;
      })
  );
  const first = getDevicePushTokenAsync();
  const second = getDevicePushTokenAsync();
  const rejected = Promise.allSettled([first, second]);
  expect(mockNativeRequest).toHaveBeenCalledTimes(1);
  rejectRequest(new Error('shared failure'));
  expect(await rejected).toEqual([
    { status: 'rejected', reason: expect.any(Error) },
    { status: 'rejected', reason: expect.any(Error) },
  ]);
});

it('clears a successful request so later calls can obtain a fresh token', async () => {
  mockNativeRequest.mockResolvedValueOnce('first').mockResolvedValueOnce('second');
  await expect(getDevicePushTokenAsync()).resolves.toEqual({
    type: 'ios',
    data: 'first',
  });
  await expect(getDevicePushTokenAsync()).resolves.toEqual({
    type: 'ios',
    data: 'second',
  });
  expect(mockNativeRequest).toHaveBeenCalledTimes(2);
});
