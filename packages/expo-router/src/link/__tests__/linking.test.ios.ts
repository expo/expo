import * as Linking from 'expo-linking';

import { getInitialURL, getRootURL, subscribe } from '../linking';

let mockLinkingListener: ((event: { url: string }) => void) | undefined;

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string) => `yourscheme://${path}`),
  getLinkingURL: jest.fn(),
  addEventListener: jest.fn((_event: string, listener: (event: { url: string }) => void) => {
    mockLinkingListener = listener;
    return { remove: jest.fn() };
  }),
}));

const mockedLinking = Linking as jest.Mocked<typeof Linking>;

beforeEach(() => {
  mockLinkingListener = undefined;
  mockedLinking.getLinkingURL.mockReset();
  mockedLinking.createURL.mockClear();
  mockedLinking.addEventListener.mockClear();
});

it('uses the iOS linking URL as the initial URL', () => {
  mockedLinking.getLinkingURL.mockReturnValue('yourscheme:///profile/evan?tab=posts');

  expect(getInitialURL()).toBe('yourscheme:///profile/evan?tab=posts');
});

it('falls back to the root URL when no initial URL is available', () => {
  mockedLinking.getLinkingURL.mockReturnValue(null);

  expect(getInitialURL()).toBe(getRootURL());
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

  expect(mockedLinking.addEventListener).toHaveBeenCalledWith('url', expect.any(Function));

  mockLinkingListener?.({ url: 'yourscheme:///incoming?x=1' });

  await Promise.resolve();

  expect(listener).toHaveBeenCalledWith('yourscheme:///rewritten?x=1');

  unsubscribe();
});
