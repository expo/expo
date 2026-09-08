import * as Linking from 'expo-linking';

import { subscribe } from '../linking';

let mockLinkingListener: ((event: { url: string }) => void | Promise<void>) | undefined;
const mockRemove = jest.fn();

jest.mock('expo-linking', () => ({
  addEventListener: jest.fn(
    (_event: string, listener: (event: { url: string }) => void | Promise<void>) => {
      mockLinkingListener = listener;
      return { remove: mockRemove };
    }
  ),
}));

const mockedLinking = jest.mocked(Linking);

beforeEach(() => {
  mockLinkingListener = undefined;
  mockedLinking.addEventListener.mockClear();
  mockRemove.mockClear();
});

it('rewrites incoming URL events before notifying the router', async () => {
  const listener = jest.fn();
  const unsubscribe = subscribe(
    {
      redirectSystemPath({ path, initial }) {
        expect(initial).toBe(false);
        return path?.replace('/incoming', '/rewritten');
      },
    },
    undefined
  )(listener);

  await mockLinkingListener?.({ url: 'yourscheme:///incoming?x=1' });

  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener).toHaveBeenCalledWith('yourscheme:///rewritten?x=1');

  unsubscribe();
  expect(mockRemove).toHaveBeenCalledTimes(1);
});

it('applies redirects before notifying the router about incoming URLs', async () => {
  const listener = jest.fn();
  const unsubscribe = subscribe(undefined, [
    [/^old\/$/, { source: '/old', destination: '/new', destinationContextKey: './new.tsx' }, false],
  ])(listener);

  await mockLinkingListener?.({ url: '/old' });

  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener).toHaveBeenCalledWith('new');

  unsubscribe();
});
