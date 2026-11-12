import { act, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { useLocalSearchParams } from '../hooks';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { renderRouter } from '../testing-library';

afterEach(() => {
  jest.restoreAllMocks();
});

// An Android Activity relaunch mounts the new root before it unmounts the old root.

it('router.push navigates in the new root after the old root unmounts', async () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  const oldRoot = await renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index" />,
    second: () => <Text testID="second" />,
  });
  await renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index" />,
    second: () => <Text testID="second" />,
  });
  await oldRoot.unmount();

  await act(() => router.push('/second'));

  expect(screen.getByTestId('second')).toBeVisible();
});

it('router.canGoBack reads the new root after the old root unmounts', async () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  const oldRoot = await renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index" />,
  });
  await renderRouter(
    {
      _layout: {
        unstable_settings: { initialRouteName: 'index' },
        default: () => <Stack />,
      },
      index: () => <Text testID="index" />,
      second: () => <Text testID="second" />,
    },
    { initialUrl: '/second' }
  );
  await oldRoot.unmount();

  expect(router.canGoBack()).toBe(true);
});

it('router.setParams updates the new root after the old root unmounts', async () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  const oldRoot = await renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index" />,
  });
  await renderRouter({
    _layout: () => <Stack />,
    index: function Index() {
      const { q } = useLocalSearchParams();
      return <Text testID="index">{q}</Text>;
    },
  });
  await oldRoot.unmount();

  await act(() => router.setParams({ q: 'new' }));

  expect(screen.getByTestId('index')).toHaveTextContent('new');
});

it('warns in development when a second root mounts', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const error = jest.spyOn(console, 'error');
  await renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index" />,
  });
  await renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index" />,
  });

  expect(warn).toHaveBeenCalledTimes(2);
  // The router bridge uses a layout effect, so its warning comes before the linking warning.
  expect(warn).toHaveBeenNthCalledWith(
    1,
    'Two Expo Router roots are mounted at the same time. This is expected for a moment during an Android Activity relaunch, and the newest root receives the `router` calls. At other times, make sure that the app renders only one root component.'
  );
  expect(warn).toHaveBeenNthCalledWith(
    2,
    'Two Expo Router roots handle deep links at the same time. This is expected for a moment during an Android Activity relaunch. At other times, make sure that the app renders only one root component.'
  );
  expect(error).not.toHaveBeenCalled();
});
