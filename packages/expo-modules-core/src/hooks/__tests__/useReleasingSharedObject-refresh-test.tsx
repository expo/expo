import { act, renderHook } from '@testing-library/react-native';

import { SharedObject } from '../../SharedObject';
import { useReleasingSharedObjectWithLifecycle } from '../useReleasingSharedObjectWithLifecycle';

let mockRefreshVersion = 0;

// Fast Refresh invalidates effect/memo dependencies while preserving refs and state.
jest.mock('react', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    ...React,
    useEffect: ((effect, dependencies) =>
      React.useEffect(
        effect,
        dependencies && [...dependencies, mockRefreshVersion]
      )) as typeof React.useEffect,
    useInsertionEffect: ((effect, dependencies) =>
      React.useInsertionEffect(
        effect,
        dependencies && [...dependencies, mockRefreshVersion]
      )) as typeof React.useInsertionEffect,
    useMemo: ((factory, dependencies) =>
      React.useMemo(factory, [...dependencies, mockRefreshVersion])) as typeof React.useMemo,
  };
});

class TestSharedObject extends SharedObject {
  release = jest.fn();
}

beforeEach(() => {
  mockRefreshVersion = 0;
});

it('preserves the object and pending updates across Fast Refresh without replaying updates', async () => {
  let finishUpdate!: () => void;
  const pending = new Promise<void>((resolve) => {
    finishUpdate = resolve;
  });
  const factory = jest.fn(() => new TestSharedObject());
  const update = jest.fn(() => pending);
  const { result, rerender, unmount } = renderHook(
    ({ source }: { source: number }) =>
      useReleasingSharedObjectWithLifecycle({ factory, shouldRecreate: () => false, update }, [
        source,
      ]),
    { initialProps: { source: 0 } }
  );
  const object = result.current;

  mockRefreshVersion++;
  rerender({ source: 0 });
  await act(async () => {});
  expect(result.current).toBe(object);
  expect(object.release).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();

  rerender({ source: 1 });
  mockRefreshVersion++;
  rerender({ source: 1 });
  await act(async () => finishUpdate());
  expect(result.current).toBe(object);
  expect(factory).toHaveBeenCalledTimes(1);
  expect(update).toHaveBeenCalledTimes(1);
  expect(object.release).not.toHaveBeenCalled();

  unmount();
  await act(async () => {});
  expect(object.release).toHaveBeenCalledTimes(1);
});

it('waits for new pending work when refresh changes dependencies and replaces the object', async () => {
  let finishFirst!: () => void;
  let finishSecond!: () => void;
  const first = new Promise<void>((resolve) => {
    finishFirst = resolve;
  });
  const second = new Promise<void>((resolve) => {
    finishSecond = resolve;
  });
  const update = jest.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
  const { result, rerender, unmount } = renderHook(
    ({ kind, source }: { kind: number; source: number }) =>
      useReleasingSharedObjectWithLifecycle(
        {
          factory: () => new TestSharedObject(),
          shouldRecreate: (_, { previousDependencies, dependencies }) =>
            previousDependencies[0] !== dependencies[0],
          update,
        },
        [kind, source]
      ),
    { initialProps: { kind: 0, source: 0 } }
  );
  const original = result.current;
  rerender({ kind: 0, source: 1 });
  // Queue settlement, then refresh and start more work before microtasks run.
  finishFirst();
  mockRefreshVersion++;
  rerender({ kind: 0, source: 2 });
  expect(result.current).toBe(original);
  expect(update).toHaveBeenCalledTimes(2);

  mockRefreshVersion++;
  rerender({ kind: 1, source: 0 });
  const replacement = result.current;
  expect(replacement).not.toBe(original);
  await act(async () => {});
  expect(original.release).not.toHaveBeenCalled();
  expect(replacement.release).not.toHaveBeenCalled();
  expect(update).toHaveBeenCalledTimes(2);
  unmount();
  await act(async () => {});
  expect(original.release).not.toHaveBeenCalled();
  expect(replacement.release).toHaveBeenCalledTimes(1);

  await act(async () => finishSecond());
  expect(original.release).toHaveBeenCalledTimes(1);
  expect(replacement.release).toHaveBeenCalledTimes(1);
});
