import { Text } from 'react-native';

import { router } from '../../imperative-api';
import { act, renderRouter, screen, within } from '../../testing-library';
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
