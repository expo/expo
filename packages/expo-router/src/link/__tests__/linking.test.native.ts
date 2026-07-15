import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { getInitialURL, getRootURL, subscribe } from '../linking';
import { getInitialURLWithTimeout } from '../../fork/useLinking';

let mockLinkingListener: ((event: { url: string }) => void) | undefined;

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string) => `yourscheme://${path}`),
  getLinkingURL: jest.fn(),
  openURL: jest.fn(),
  addEventListener: jest.fn(
    (_event: string, listener: (event: { url: string }) => void) => {
      mockLinkingListener = listener;
      return { remove: jest.fn() };
    }
  ),
}));

jest.mock('../../fork/useLinking', () => ({
  getInitialURLWithTimeout: jest.fn(),
}));

const mockedGetInitialURLWithTimeout =
  getInitialURLWithTimeout as jest.MockedFunction<
    typeof getInitialURLWithTimeout
  >;
const mockedLinking = Linking as jest.Mocked<typeof Linking>;

beforeEach(() => {
  mockLinkingListener = undefined;
  mockedGetInitialURLWithTimeout.mockReset();
  mockedLinking.getLinkingURL.mockReset();
  mockedLinking.addEventListener.mockClear();
  mockedLinking.createURL.mockClear();
});

it('uses the native platform initial URL when one is available', async () => {
  if (Platform.OS === 'android') {
    mockedGetInitialURLWithTimeout.mockReturnValue(
      'yourscheme:///profile/evan'
    );

    await expect(getInitialURL()).resolves.toBe('yourscheme:///profile/evan');
  } else {
    mockedLinking.getLinkingURL.mockReturnValue(
      'yourscheme:///profile/evan?tab=posts'
    );

    expect(getInitialURL()).toBe('yourscheme:///profile/evan?tab=posts');
  }
});

it('falls back to the root URL when no initial URL is available', async () => {
  if (Platform.OS === 'android') {
    mockedGetInitialURLWithTimeout.mockReturnValue(null);

    await expect(getInitialURL()).resolves.toBe('yourscheme:///');
  } else {
    mockedLinking.getLinkingURL.mockReturnValue(null);

    expect(getInitialURL()).toBe(getRootURL());
  }

  expect(mockedLinking.createURL).toHaveBeenCalledWith('/');
});

it('rewrites incoming URL events before notifying the router', async () => {
  const listener = jest.fn();
  const unsubscribe = subscribe({
    redirectSystemPath({ path, initial }) {
      expect(initial).toBe(false);
      return path?.replace('/incoming', '/rewritten');
    },
  })(listener);

  expect(mockedLinking.addEventListener).toHaveBeenCalledWith(
    'url',
    expect.any(Function)
  );

  mockLinkingListener?.({ url: 'yourscheme:///incoming?x=1' });

  await Promise.resolve();

  expect(listener).toHaveBeenCalledWith('yourscheme:///rewritten?x=1');

  unsubscribe();
});

it('applies redirects before notifying the router about incoming URLs', async () => {
  const listener = jest.fn();
  subscribe(undefined, [
    [/^old\/$/, { source: '/old', destination: '/new' }, false],
  ])(listener);

  mockLinkingListener?.({ url: '/old' });

  await Promise.resolve();

  expect(listener).toHaveBeenCalledWith('new');
});
