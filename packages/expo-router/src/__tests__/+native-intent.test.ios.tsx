import { act } from '@testing-library/react-native';
import React from 'react';
import { View } from 'react-native';

import { renderRouter, screen } from '../testing-library';

it('can use redirectSystemPath initial', () => {
  renderRouter({
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

  renderRouter({
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

it('legacy_subscribe', () => {
  let listener: (url: string) => void = () => {};

  renderRouter({
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

  act(() => listener('/apple'));
  expect(screen.getByTestId('apple')).toBeVisible();
});
