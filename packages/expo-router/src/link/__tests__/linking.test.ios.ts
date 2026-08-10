import * as Linking from 'expo-linking';

import type { StoreRedirects } from '../../global-state/router-store';
import type { NativeIntent } from '../../types';
import { subscribe } from '../linking';

afterEach(() => {
  jest.restoreAllMocks();
});

it('preprocesses legacy subscription URLs through redirects and redirectSystemPath once', async () => {
  let legacyListener: ((url: string) => void) | undefined;
  const redirectSystemPath = jest.fn(({ path }: { path: string }) => `/final?from=${path}`);
  const nativeLinking: NativeIntent = {
    redirectSystemPath,
    legacy_subscribe(listener) {
      legacyListener = listener;
    },
  };
  const redirects: StoreRedirects[] = [
    [
      /^legacy\/$/,
      {
        source: '/legacy',
        destination: '/redirected',
        destinationContextKey: './redirected',
      },
      false,
    ],
  ];
  const listener = jest.fn();
  // The test only needs the subscription's public removal method.
  jest
    .spyOn(Linking, 'addEventListener')
    .mockReturnValue({ remove: jest.fn() } as unknown as ReturnType<
      typeof Linking.addEventListener
    >);

  subscribe(nativeLinking, redirects)(listener);
  legacyListener?.('/legacy');
  await Promise.resolve();

  expect(redirectSystemPath).toHaveBeenCalledTimes(1);
  expect(redirectSystemPath).toHaveBeenCalledWith({ path: 'redirected', initial: false });
  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener).toHaveBeenCalledWith('/final?from=redirected');
});
