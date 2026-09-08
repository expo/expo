import { screen, act } from '@testing-library/react-native';
import { View } from 'react-native';

import { renderRouter } from '../testing-library';

it('redirects the initial URL with redirectSystemPath', () => {
  renderRouter(
    {
      rewritten: () => <View testID="rewritten" />,
      '+native-intent': {
        redirectSystemPath({ path, initial }) {
          expect(path).toBe('/incoming');
          expect(initial).toBe(true);
          return '/rewritten';
        },
      },
    },
    { initialUrl: '/incoming' }
  );

  expect(screen.getByTestId('rewritten')).toBeVisible();
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

it('navigates to URLs received from legacy_subscribe with path and query params', () => {
  let listener: (url: string) => void = () => {};

  renderRouter({
    index: () => <View testID="index" />,
    'fruit/[name]': () => <View testID="fruit" />,
    '+native-intent': {
      legacy_subscribe(listenerFn) {
        listener = listenerFn;
        return () => {};
      },
    },
  });

  expect(screen.getByTestId('index')).toBeVisible();

  act(() => listener('/fruit/apple?color=red'));

  expect(screen.getByTestId('fruit')).toBeVisible();
  expect(screen).toHavePathnameWithParams('/fruit/apple?color=red');
});
