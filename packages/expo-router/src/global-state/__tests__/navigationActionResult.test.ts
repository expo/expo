import type { NavigationState } from '../../react-navigation/routers';
import { createNavigationActionResultRegistry } from '../navigationActionResult';

const outcome = { status: 'handled' as const, state: {} as NavigationState };

test('a committed report settles exactly once, even when effects replay', () => {
  const registry = createNavigationActionResultRegistry();
  const callback = jest.fn();
  const { id } = registry.register(callback);
  registry.settle(id, outcome);
  registry.settle(id, outcome);
  expect(callback).toHaveBeenCalledTimes(1);
});

test('removing an observer and unmount cleanup release pending callbacks', () => {
  const registry = createNavigationActionResultRegistry();
  const removed = jest.fn();
  const unmounted = jest.fn();
  const subscription = registry.register(removed);
  const pending = registry.register(unmounted);
  subscription.remove();
  registry.settle(subscription.id, outcome);
  registry.clear();
  registry.settle(pending.id, outcome);
  expect(removed).not.toHaveBeenCalled();
  expect(unmounted).not.toHaveBeenCalled();
});

test('a throwing consumer is released before the error propagates', () => {
  const registry = createNavigationActionResultRegistry();
  const callback = jest.fn(() => {
    throw new Error('consumer');
  });
  const { id } = registry.register(callback);
  expect(() => registry.settle(id, outcome)).toThrow('consumer');
  registry.settle(id, outcome);
  expect(callback).toHaveBeenCalledTimes(1);
});
