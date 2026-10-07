import type { EventSubscription } from 'expo';

import { addPushTokenListener } from '../TokenEmitter';

type NativeTokenHandler = (event: { devicePushToken: string }) => void;

jest.mock('../PushTokenManager', () => ({
  addListener: (eventName: string, handler: NativeTokenHandler) =>
    mockAddListener(eventName, handler),
}));
jest.mock('../warnOfExpoGoPushUsage', () => ({
  warnOfExpoGoPushUsage: jest.fn(),
}));

const mockAddListener = jest.fn<EventSubscription, [string, NativeTokenHandler]>(() => ({
  remove: jest.fn(),
}));

function nativeHandlerOf(listenerIndex: number): NativeTokenHandler {
  const call = mockAddListener.mock.calls[listenerIndex];
  if (!call) {
    throw new Error(`No push token listener was added at index ${listenerIndex}.`);
  }
  return call[1];
}

beforeEach(() => {
  mockAddListener.mockClear();
});

it('calls the listener only once for two events with the same token', () => {
  const listener = jest.fn();
  addPushTokenListener(listener);

  nativeHandlerOf(0)({ devicePushToken: 'token-a' });
  nativeHandlerOf(0)({ devicePushToken: 'token-a' });

  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener).toHaveBeenCalledWith({ data: 'token-a', type: 'ios' });
});

it('calls the listener again when the token changes', () => {
  const listener = jest.fn();
  addPushTokenListener(listener);

  nativeHandlerOf(0)({ devicePushToken: 'token-a' });
  nativeHandlerOf(0)({ devicePushToken: 'token-a' });
  nativeHandlerOf(0)({ devicePushToken: 'token-b' });

  expect(listener).toHaveBeenCalledTimes(2);
  expect(listener).toHaveBeenLastCalledWith({ data: 'token-b', type: 'ios' });
});

it('keeps a separate last token for each listener', () => {
  const firstListener = jest.fn();
  const secondListener = jest.fn();
  addPushTokenListener(firstListener);
  addPushTokenListener(secondListener);

  nativeHandlerOf(0)({ devicePushToken: 'token-a' });
  nativeHandlerOf(0)({ devicePushToken: 'token-a' });
  nativeHandlerOf(1)({ devicePushToken: 'token-a' });

  expect(firstListener).toHaveBeenCalledTimes(1);
  expect(secondListener).toHaveBeenCalledTimes(1);
});
