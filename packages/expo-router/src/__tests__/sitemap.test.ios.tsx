import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { router } from '../imperative-api';
import { renderRouter } from '../testing-library';
import { Slot } from '../views/Navigator';

jest.mock('expo-constants', () => ({
  ...jest.requireActual('expo-constants'),
  expoConfig: {
    sdkVersion: '54.0.0',
  },
}));

// TODO(@hassankhan): Move this mock to __mocks__
// `window.location` is set on all platforms in Expo Router
const originalWindow = (global as any).window;
beforeAll(() => {
  (global as any).window = {
    location: {
      origin: 'http://localhost:8081',
    },
  };
});

afterAll(() => {
  (global as any).window = originalWindow;
});

const originalHermes = (global as any).HermesInternal;
beforeAll(() => {
  (global as any).HermesInternal = {
    getRuntimeProperties: () => ({
      'OSS Release Version': 'for RN 0.79.5',
    }),
  };
});

afterAll(() => {
  (global as any).HermesInternal = originalHermes;
});

test('given no routes, renders no route in the sitemap', async () => {
  await renderRouter({
    _layout: () => (
      <View testID="layout">
        <Slot />
      </View>
    ),
  });
  await act(() => router.replace('/_sitemap'));
  expect(screen).toHavePathname('/_sitemap');
  expect(screen.getByTestId('expo-router-sitemap')).toBeVisible();
  expect(screen.queryByTestId('sitemap-item-container')).toBeNull();
});

test('given single index route, renders one route', async () => {
  await renderRouter({
    _layout: () => <Slot />,
    index: () => <Text />,
  });
  await act(() => router.replace('/_sitemap'));
  expect(screen.getByTestId('expo-router-sitemap')).toBeVisible();
  expect(screen.getByText('index.js')).toBeVisible();
});

test('given multiple same level routes, renders them as flat list', async () => {
  await renderRouter({
    _layout: () => <Slot />,
    index: () => <Text />,
    about: () => <Text />,
    contact: () => <Text />,
  });
  await act(() => router.replace('/_sitemap'));
  const containers = screen.getAllByTestId('sitemap-item-container');
  expect(containers).toHaveLength(3);
  expect(containers[0]).toHaveTextContent('index.js');
  expect(containers[1]).toHaveTextContent('about.js');
  expect(containers[2]).toHaveTextContent('contact.js');
});

test('given nested layout without children, renders layout header', async () => {
  await renderRouter({
    _layout: () => <Slot />,
    index: () => <Text />,
    about: () => <Text />,
    'nested/_layout': () => <Slot />,
  });
  await act(() => router.replace('/_sitemap'));
  const containers = screen.getAllByTestId('sitemap-item-container');
  expect(containers).toHaveLength(3);
  expect(containers[0]).toHaveTextContent('index.js');
  expect(containers[1]).toHaveTextContent('about.js');
  expect(containers[2]).toHaveTextContent('nested/_layout.js');
});

test('renders collapsed header for nested layout', async () => {
  await renderRouter({
    _layout: () => <Slot />,
    index: () => <Text />,
    about: () => <Text />,
    'nested/_layout': () => <Slot />,
    'nested/index': () => <Text />,
    'nested/one': () => <Text />,
  });
  await act(() => router.replace('/_sitemap'));
  const containers = screen.getAllByTestId('sitemap-item-container');
  expect(containers).toHaveLength(3);
  expect(containers[0]).toHaveTextContent('index.js');
  expect(containers[1]).toHaveTextContent('about.js');
  expect(containers[2]).toHaveTextContent('nested/_layout.js');
});

test('expands nested route when the layout header is pressed', async () => {
  await renderRouter({
    _layout: () => <Slot />,
    index: () => <Text />,
    about: () => <Text />,
    'nested/_layout': () => <Slot />,
    'nested/index': () => <Text />,
    'nested/one': () => <Text />,
  });
  await act(() => router.replace('/_sitemap'));
  const containers = screen.getAllByTestId('sitemap-item-container');

  const nestedContainer = containers[2]!;
  const layoutHeader = within(nestedContainer).getByTestId('sitemap-item');
  await act(() => fireEvent.press(layoutHeader));
  await waitFor(() => {
    expect(within(nestedContainer).getAllByTestId('sitemap-item')).toHaveLength(3);
  });

  const nestedItems = within(nestedContainer).getAllByTestId('sitemap-item');
  expect(containers[0]).toHaveTextContent('index.js');
  expect(containers[1]).toHaveTextContent('about.js');
  expect(nestedItems).toHaveLength(3);
  expect(nestedItems[0]).toHaveTextContent('nested/_layout.js');
  expect(nestedItems[1]).toHaveTextContent('index.js');
  expect(nestedItems[2]).toHaveTextContent('one.js');
});

test('renders and expands all levels of a deeply nested route on presses on headers', async () => {
  await renderRouter({
    _layout: () => <Slot />,
    index: () => <Text />,
    about: () => <Text />,
    'nested/_layout': () => <Slot />,
    'nested/index': () => <Text />,
    'nested/secondLevel/_layout': () => <Text />,
    'nested/secondLevel/index': () => <Text />,
  });
  await act(() => router.replace('/_sitemap'));
  const containers = screen.getAllByTestId('sitemap-item-container');
  expect(containers).toHaveLength(3);

  const nestedContainer = containers[2]!;
  const layoutHeader = within(nestedContainer).getByTestId('sitemap-item');
  await act(() => fireEvent.press(layoutHeader));
  await waitFor(() => {
    expect(within(nestedContainer).getAllByTestId('sitemap-item')).toHaveLength(3);
  });

  let nestedItems = within(nestedContainer).getAllByTestId('sitemap-item');
  const deepLayoutHeader = nestedItems[2]!;

  await act(() => fireEvent.press(deepLayoutHeader));
  await waitFor(() => {
    expect(within(nestedContainer).getAllByTestId('sitemap-item')).toHaveLength(4);
  });

  nestedItems = within(nestedContainer).getAllByTestId('sitemap-item');
  expect(nestedItems).toHaveLength(4);
  expect(nestedItems[0]).toHaveTextContent('nested/_layout.js');
  expect(nestedItems[1]).toHaveTextContent('index.js');
  expect(nestedItems[2]).toHaveTextContent('secondLevel/_layout.js');
  expect(nestedItems[3]).toHaveTextContent('index.js');
});

describe('system information', () => {
  it('shows location origin, Expo SDK version and Hermes version', async () => {
    await renderRouter({
      _layout: () => <Slot />,
      index: () => <Text />,
    });
    await act(() => router.replace('/_sitemap'));
    expect(screen.getByText('System Information')).toBeOnTheScreen();

    expect(screen.getByText('Location origin')).toBeOnTheScreen();
    expect(screen.getByText('http://localhost:8081')).toBeOnTheScreen();

    expect(screen.getByText('Expo SDK')).toBeOnTheScreen();
    expect(screen.getByText('54.0.0')).toBeOnTheScreen();

    expect(screen.getByText('Hermes version')).toBeOnTheScreen();
    expect(screen.getByText('for RN 0.79.5')).toBeOnTheScreen();
  });
});

describe('links', () => {
  let containers: ReturnType<typeof screen.getAllByTestId>;
  beforeEach(async () => {
    await renderRouter({
      _layout: () => <Slot />,
      index: () => <Text />,
      about: () => <Text />,
      'nested/_layout': () => <Slot />,
      'nested/index': () => <Text />,
    });
    await act(() => router.replace('/_sitemap'));
    containers = screen.getAllByTestId('sitemap-item-container');
    expect(containers).toHaveLength(3);
  });
  test('clicking the first sitemap item navigates to the index page', async () => {
    const link = within(containers[0]!).getByRole('link');
    await act(() => fireEvent.press(link));
    expect(screen).toHavePathname('/');
  });
  test('clicking the second sitemap item navigates to the about page', async () => {
    const link = within(containers[1]!).getByRole('link');
    await act(() => fireEvent.press(link));
    expect(screen).toHavePathname('/about');
  });
  describe('nested links', () => {
    let nestedContainer: ReturnType<typeof screen.getByTestId>;
    beforeEach(async () => {
      nestedContainer = containers[2]!;
      const layoutHeader = within(nestedContainer).getByTestId('sitemap-item');
      await act(() => fireEvent.press(layoutHeader));
      await waitFor(() => {
        expect(within(nestedContainer).getAllByTestId('sitemap-item')).toHaveLength(2);
      });
    });
    test('only one link is rendered in the nested container', () => {
      const links = within(nestedContainer).getAllByRole('link');
      expect(links).toHaveLength(1);
    });
    test('clicking the link within the nested container navigates to the nested index page', async () => {
      const link = within(nestedContainer).getByRole('link');
      expect(link).toHaveTextContent('index.js');
      await act(() => fireEvent.press(link));
      expect(screen).toHavePathname('/nested');
    });
  });
});
