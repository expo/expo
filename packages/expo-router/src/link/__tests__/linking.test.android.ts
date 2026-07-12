import * as Linking from 'expo-linking';

import { getInitialURL, subscribe } from '../linking';
import { getInitialURLWithTimeout } from '../../fork/useLinking';

let mockLinkingListener: ((event: { url: string }) => void) | undefined;

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string) => `yourscheme://${path}`),
  openURL: jest.fn(),
  addEventListener: jest.fn((_event: string, listener: (event: { url: string }) => void) => {
    mockLinkingListener = listener;
    return { remove: jest.fn() };
  }),
}));

jest.mock('../../fork/useLinking', () => ({
  getInitialURLWithTimeout: jest.fn(),
}));

const mockedGetInitialURLWithTimeout = getInitialURLWithTimeout as jest.MockedFunction<
  typeof getInitialURLWithTimeout
>;
const mockedLinking = Linking as jest.Mocked<typeof Linking>;

beforeEach(() => {
  mockLinkingListener = undefined;
  mockedGetInitialURLWithTimeout.mockReset();
  mockedLinking.addEventListener.mockClear();
  mockedLinking.createURL.mockClear();
});

it('uses the Android initial URL when one is available', async () => {
  mockedGetInitialURLWithTimeout.mockReturnValue('yourscheme:///profile/evan');

  await expect(getInitialURL()).resolves.toBe('yourscheme:///profile/evan');
});

it('falls back to the root URL when Android has no initial URL', async () => {
  mockedGetInitialURLWithTimeout.mockReturnValue(null);

  await expect(getInitialURL()).resolves.toBe('yourscheme:///');
  expect(mockedLinking.createURL).toHaveBeenCalledWith('/');
});

it('applies redirects before notifying the router about incoming URLs', async () => {
  const listener = jest.fn();
  subscribe(undefined, [[/^old\/$/, { source: '/old', destination: '/new' }, false]])(listener);

  mockLinkingListener?.({ url: '/old' });

  await Promise.resolve();

  expect(listener).toHaveBeenCalledWith('new');
});
