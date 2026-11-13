import { screen, act } from '@testing-library/react-native';
import { View } from 'react-native';

import { renderRouter } from '../testing-library';

it('can use redirectSystemPath initial', async () => {
  await renderRouter({
    index: () => <View testID="index" />,
    page: () => <View testID="page" />,
    '+native-intent': {
      redirectSystemPath({ path, initial }) {
        if (initial) {
          return '/page';
        }
        return path;
      },
    },
  });

  expect(screen.getByTestId('page')).toBeVisible();
});

it('can use async redirectSystemPath', async () => {
  let resolve: (path: string) => void;
  const promise = new Promise<string>((res) => (resolve = res));

  await renderRouter({
    index: () => <View testID="index" />,
    page: () => <View testID="page" />,
    '+native-intent': {
      redirectSystemPath({ path, initial }) {
        if (initial) {
          return promise;
        }
        return path;
      },
    },
  });

  expect(screen.toJSON()).toBeNull();

  await act(async () => resolve('/page'));

  expect(screen.getByTestId('page')).toBeVisible();
});

it('legacy_subscribe', async () => {
  let listener: (url: string) => void = () => {};

  await renderRouter({
    index: () => <View testID="index" />,
    apple: () => <View testID="apple" />,
    '+native-intent': {
      legacy_subscribe(listenerFn) {
        listener = listenerFn;
        return () => {};
      },
    },
  });

  expect(screen.getByTestId('index')).toBeVisible();

  await act(() => listener('/apple'));
  expect(screen.getByTestId('apple')).toBeVisible();
});
