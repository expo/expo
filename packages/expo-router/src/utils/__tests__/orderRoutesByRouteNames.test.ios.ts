import { orderRoutesByRouteNames } from '../orderRoutesByRouteNames';

const routes = [
  { key: 'apple-key', name: 'apple' },
  { key: 'orange-key', name: 'orange' },
  { key: 'pear-key', name: 'pear' },
];

test('orders routes by route names', () => {
  expect(orderRoutesByRouteNames(routes, ['pear', 'apple', 'orange'])).toEqual([
    routes[2],
    routes[0],
    routes[1],
  ]);
});

test('skips missing route names and routes absent from route names', () => {
  expect(orderRoutesByRouteNames(routes, ['missing', 'pear', 'apple'])).toEqual([
    routes[2],
    routes[0],
  ]);
});

test('returns the input when routes are already ordered', () => {
  expect(
    orderRoutesByRouteNames(
      routes,
      routes.map((route) => route.name)
    )
  ).toBe(routes);
});
