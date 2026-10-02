import { act, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { renderRouter } from '../testing-library';

// `babel-preset-expo` inlines `EXPO_ROUTER_IMPORT_MODE` as `sync` in Jest, so screens still render
// synchronously. The router config option makes `loadRoute` unwrap Metro's async require result.
jest.mock('expo-constants', () => ({
  ...jest.requireActual('expo-constants'),
  expoConfig: { extra: { router: { importMode: 'lazy' } } },
}));

it('applies the anchor of a layout whose chunk loads after the route tree is built', async () => {
  let chunkLoaded = false;
  const profileLayout = {
    unstable_settings: { anchor: 'index' },
    default: () => <Stack />,
  };
  const pendingChunk = new Promise(() => {});

  await renderRouter(
    {
      _layout: function RootLayout() {
        // The chunk is loaded by the time a nested layout can render.
        chunkLoaded = true;
        return <Stack />;
      },
      index: () => <Text testID="index">index</Text>,
      // Like Metro's async require: `_result` is a promise until the chunk loads, then the module.
      'profile/_layout': {
        default: profileLayout.default,
        get _result() {
          return chunkLoaded ? profileLayout : pendingChunk;
        },
      },
      'profile/index': () => <Text testID="profile">profile</Text>,
      'profile/[id]': () => <Text testID="profile-id">profile id</Text>,
    },
    { initialUrl: '/profile/1' }
  );

  expect(screen.getByTestId('profile-id')).toBeVisible();
  expect(router.canGoBack()).toBe(true);

  await act(() => router.back());

  expect(screen).toHavePathname('/profile');
});
