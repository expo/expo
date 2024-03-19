import React from 'react';
import { View } from 'react-native';

import { act, renderRouter, screen } from '../testing-library';

it('can provide custom getInitialUrl', () => {
  renderRouter({
    '+native': {
      getInitialURL: () => {
        return '/page';
      },
    },
    index: () => <View testID="index" />,
    page: () => <View testID="page" />,
  });

  expect(screen.getByTestId('page')).toBeVisible();
});

it('can provide an async getInitialUrl', async () => {
  let resolve;
  const getInitialURL = () => new Promise<string>((r) => (resolve = r));

  renderRouter({
    '+native': { getInitialURL },
    index: () => <View testID="index" />,
    page: () => <View testID="page" />,
  });

  await act(async () => resolve('/page'));

  expect(screen.getByTestId('page')).toBeVisible();
});

it('can provide custom getInitialUrl with a prefix', () => {
  renderRouter({
    '+native': {
      prefixes: ['https://myapp.com'],
      getInitialURL: () => {
        return 'https://myapp.com/page';
      },
    },
    index: () => <View testID="index" />,
    page: () => <View testID="page" />,
  });

  expect(screen.getByTestId('page')).toBeVisible();
});

it('can provide custom a custom subscribe function', () => {
  const Linking = {
    subscriptions: new Map<string, any>(),
    fireEvent(type: string, event: { url: string }) {
      this.subscriptions.get(type)?.(event);
    },
    addEventListener(type: string, listener: (event: { url: string }) => void) {
      this.subscriptions.set(type, listener);
      return {
        remove: () => this.subscriptions.delete(type),
      };
    },
  };

  renderRouter({
    '+native': {
      subscribe(listener) {
        const subscription = Linking.addEventListener('url', ({ url }) => {
          listener(url);
        });

        return () => subscription.remove();
      },
    },
    index: () => <View testID="index" />,
    page: () => <View testID="page" />,
  });

  act(() => Linking.fireEvent('url', { url: '/page' }));

  expect(screen.getByTestId('page')).toBeVisible();
});
