import { Text } from 'react-native';

import { router } from '../../imperative-api';
import { act, fireEvent, renderRouter, screen, within } from '../../testing-library';
import { Slot } from '../../views/Navigator';

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

test('given nested route, renders nested routes in same container ', () => {
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
  const nestedContainer = containers[2];
  const nestedItems = within(nestedContainer).getAllByTestId('sitemap-item');
  expect(nestedItems).toHaveLength(3);
  expect(nestedItems[0]).toHaveTextContent('nested/_layout.js');
  expect(nestedItems[1]).toHaveTextContent('index.js');
  expect(nestedItems[2]).toHaveTextContent('one.js');
});

test('given deeply nested route, renders all levels of ', () => {
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
  expect(containers[0]).toHaveTextContent('index.js');
  expect(containers[1]).toHaveTextContent('about.js');
  const nestedContainer = containers[2];
  const nestedItems = within(nestedContainer).getAllByTestId('sitemap-item');
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
  // The first link in the nested container is the layout route, which should not be clickable.
  describe('nested container', () => {
    test('clicking the first link (nested _layout) within the nested container keeps the user on the sitemap', () => {
      const links = within(containers[2]).getAllByRole('link');
      const link = links[0];
      expect(link).toHaveTextContent('nested/_layout.js');
      act(() => fireEvent.press(link));
      expect(screen).toHavePathname('/_sitemap');
    });
    test('clicking the second link (nested index) within the nested container navigates to the nested index page', () => {
      const links = within(containers[2]).getAllByRole('link');
      const link = links[1];
      expect(link).toHaveTextContent('index.js');
      act(() => fireEvent.press(link));
      expect(screen).toHavePathname('/nested');
    });
  });
});
