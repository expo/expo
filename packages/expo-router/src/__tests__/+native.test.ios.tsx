import { act } from '@testing-library/react-native';
import React from 'react';
import { View } from 'react-native';

import { renderRouter, screen } from '../testing-library';

it.only('redirectSystemPath initial', () => {
  renderRouter({
    index: () => <View testID="index" />,
    page: () => <View testID="page" />,
    '+native': {
      redirectSystemPath({ path, initial }) {
        return '/page';
      },
    },
  });

  expect(screen.getByTestId('page')).toBeVisible();
});

// it('can use async getInitialURL', async () => {
//   let resolve: (path: string) => void;
//   const getInitialURL = () => new Promise<string>((res) => (resolve = res));
//   renderRouter({
//     index: () => <View testID="index" />,
//     page: () => <View testID="page" />,
//     '+native': {
//       getInitialURL,
//     },
//   });

//   expect(screen.toJSON()).toBeNull();

//   await act(() => resolve('/page'));

//   expect(screen.getByTestId('page')).toBeVisible();
// });

// it('can provide custom a custom subscribe function', () => {
//   const Linking = {
//     subscriptions: new Map<string, any>(),
//     fireEvent(type: string, event: { url: string }) {
//       this.subscriptions.get(type)?.(event);
//     },
//     addEventListener(type: string, listener: (event: { url: string }) => void) {
//       this.subscriptions.set(type, listener);
//       return {
//         remove: () => this.subscriptions.delete(type),
//       };
//     },
//   };

//   renderRouter({
//     '+native': {
//       subscribe(listener) {
//         const subscription = Linking.addEventListener('url', ({ url }) => {
//           listener(url);
//         });

//         return () => subscription.remove();
//       },
//     },
//     index: () => <View testID="index" />,
//     page: () => <View testID="page" />,
//   });

//   expect(screen.getByTestId('index')).toBeVisible();

//   act(() => Linking.fireEvent('url', { url: '/page' }));

//   expect(screen.getByTestId('page')).toBeVisible();
// });
