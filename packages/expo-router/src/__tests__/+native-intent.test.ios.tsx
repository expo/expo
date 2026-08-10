import { screen, act } from '@testing-library/react-native';
import * as Linking from 'expo-linking';
import { View } from 'react-native';

import { routingQueue } from '../global-state/routingQueue';
import { renderRouter } from '../testing-library';

afterEach(() => {
  jest.restoreAllMocks();
});

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

it('legacy_subscribe', async () => {
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

  await act(async () => listener('/apple'));
  expect(screen.getByTestId('apple')).toBeVisible();
});

it('queues native external URL events as normalized router links', async () => {
  let urlListener: ((event: { url: string }) => void) | undefined;
  jest.spyOn(Linking, 'addEventListener').mockImplementation((_type, listener) => {
    urlListener = listener;
    // The test only needs the subscription's public removal method.
    return { remove: jest.fn() } as unknown as ReturnType<typeof Linking.addEventListener>;
  });
  const add = jest.spyOn(routingQueue, 'add');

  renderRouter({
    index: () => <View testID="index" />,
    apple: () => <View testID="apple" />,
  });
  add.mockClear();

  await act(async () => urlListener?.({ url: 'https://example.com/apple?color=red' }));

  expect(add).toHaveBeenCalledWith({
    type: 'ROUTER_LINK',
    payload: {
      href: '/apple?color=red',
      options: { event: 'NAVIGATE' },
    },
  });
});
