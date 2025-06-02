import { Text } from 'react-native';

import { router } from '../imperative-api';
import { act, fireEvent, renderRouter, screen, waitFor, within } from '../testing-library';
import { Slot } from '../views/Navigator';

test('given no routes, unmatched route', () => {
  renderRouter({
    _layout: () => <Slot />,
  });
  act(() => router.replace('/_sitemap'));
  expect(screen).toHavePathname('/_sitemap');
  expect(screen.getByText('Unmatched Route')).toBeOnTheScreen();
});

test('given single index route, renders one route', () => {
  renderRouter({
    _layout: () => <Slot />,
    index: () => <Text />,
  });
  act(() => router.replace('/_sitemap'));
  expect(screen.getByText('index.js')).toBeOnTheScreen();
});

test('given multiple same level routes, renders them as flat list', () => {
  renderRouter({
    _layout: () => <Slot />,
    index: () => <Text />,
    about: () => <Text />,
    contact: () => <Text />,
  });
  act(() => router.replace('/_sitemap'));
  const containers = screen.getAllByTestId('sitemap-item-container');
  expect(containers).toHaveLength(3);
  expect(containers[0]).toHaveTextContent('index.js');
  expect(containers[1]).toHaveTextContent('about.js');
  expect(containers[2]).toHaveTextContent('contact.js');
});

test('given nested layout without children, renders layout header', () => {
  renderRouter({
    _layout: () => <Slot />,
    index: () => <Text />,
    about: () => <Text />,
    'nested/_layout': () => <Slot />,
  });
  act(() => router.replace('/_sitemap'));
  const containers = screen.getAllByTestId('sitemap-item-container');
  expect(containers).toHaveLength(3);
  expect(containers[0]).toHaveTextContent('index.js');
  expect(containers[1]).toHaveTextContent('about.js');
  expect(containers[2]).toHaveTextContent('nested/_layout.js');
});

test('renders collapsed header for nested layout', () => {
  renderRouter({
    _layout: () => <Slot />,
    index: () => <Text />,
    about: () => <Text />,
    'nested/_layout': () => <Slot />,
    'nested/index': () => <Text />,
    'nested/one': () => <Text />,
  });
  act(() => router.replace('/_sitemap'));
  const containers = screen.getAllByTestId('sitemap-item-container');
  expect(containers).toHaveLength(3);
  expect(containers[0]).toHaveTextContent('index.js');
  expect(containers[1]).toHaveTextContent('about.js');
  expect(containers[2]).toHaveTextContent('nested/_layout.js');
});

test('expands nested route when the layout header is pressed', async () => {
  renderRouter({
    _layout: () => <Slot />,
    index: () => <Text />,
    about: () => <Text />,
    'nested/_layout': () => <Slot />,
    'nested/index': () => <Text />,
    'nested/one': () => <Text />,
  });
  act(() => router.replace('/_sitemap'));
  const containers = screen.getAllByTestId('sitemap-item-container');

  const nestedContainer = containers[2];
  const layoutHeader = within(nestedContainer).getByTestId('sitemap-item');
  act(() => fireEvent.press(layoutHeader));
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
  renderRouter({
    _layout: () => <Slot />,
    index: () => <Text />,
    about: () => <Text />,
    'nested/_layout': () => <Slot />,
    'nested/index': () => <Text />,
    'nested/secondLevel/_layout': () => <Text />,
    'nested/secondLevel/index': () => <Text />,
  });
  act(() => router.replace('/_sitemap'));
  const containers = screen.getAllByTestId('sitemap-item-container');
  expect(containers).toHaveLength(3);

  const nestedContainer = containers[2];
  const layoutHeader = within(nestedContainer).getByTestId('sitemap-item');
  act(() => fireEvent.press(layoutHeader));
  await waitFor(() => {
    expect(within(nestedContainer).getAllByTestId('sitemap-item')).toHaveLength(3);
  });

  let nestedItems = within(nestedContainer).getAllByTestId('sitemap-item');
  const deepLayoutHeader = nestedItems[2];

  act(() => fireEvent.press(deepLayoutHeader));
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

describe('links', () => {
  let containers: ReturnType<typeof screen.getAllByTestId>;
  beforeEach(() => {
    renderRouter({
      _layout: () => <Slot />,
      index: () => <Text />,
      about: () => <Text />,
      'nested/_layout': () => <Slot />,
      'nested/index': () => <Text />,
    });
    act(() => router.replace('/_sitemap'));
    containers = screen.getAllByTestId('sitemap-item-container');
    expect(containers).toHaveLength(3);
  });
  test('clicking the first sitemap item navigates to the index page', () => {
    const link = within(containers[0]).getByRole('link');
    act(() => fireEvent.press(link));
    expect(screen).toHavePathname('/');
  });
  test('clicking the second sitemap item navigates to the about page', () => {
    const link = within(containers[1]).getByRole('link');
    act(() => fireEvent.press(link));
    expect(screen).toHavePathname('/about');
  });
  describe('nested links', () => {
    let nestedContainer: ReturnType<typeof screen.getByTestId>;
    beforeEach(async () => {
      nestedContainer = containers[2];
      const layoutHeader = within(nestedContainer).getByTestId('sitemap-item');
      act(() => fireEvent.press(layoutHeader));
      await waitFor(() => {
        expect(within(nestedContainer).getAllByTestId('sitemap-item')).toHaveLength(2);
      });
    });
    test('only one link is rendered in the nested container', () => {
      const links = within(nestedContainer).getAllByRole('link');
      expect(links).toHaveLength(1);
    });
    test('clicking the link within the nested container navigates to the nested index page', () => {
      const link = within(nestedContainer).getByRole('link');
      expect(link).toHaveTextContent('index.js');
      act(() => fireEvent.press(link));
      expect(screen).toHavePathname('/nested');
    });
  });
});
