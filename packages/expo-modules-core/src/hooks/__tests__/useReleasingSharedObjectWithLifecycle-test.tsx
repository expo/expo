import { renderHook } from '@testing-library/react-native';
import { useEffect } from 'react';

import type { SharedObject } from '../../ts-declarations/SharedObject';
import { useReleasingSharedObject } from '../useReleasingSharedObject';

type TestSharedObject = SharedObject & {
  released: boolean;
  releaseCount: number;
  pause(): void;
};

function createTestSharedObject(): TestSharedObject {
  const object = {
    released: false,
    releaseCount: 0,
    release() {
      object.released = true;
      object.releaseCount += 1;
    },
    pause() {
      if (object.released) {
        throw new Error('Unable to find the native shared object associated with given JS object');
      }
    },
  };
  return object as unknown as TestSharedObject;
}

// Lets the microtask queued by the hook's unmount cleanup run.
function flushMicrotasks() {
  return new Promise<void>((resolve) => queueMicrotask(resolve));
}

it('does not release the object before cleanups queued after the hook run', async () => {
  const object = createTestSharedObject();
  const pauseErrors: unknown[] = [];

  const { unmount } = renderHook(() => {
    const sharedObject = useReleasingSharedObject(() => object, []);

    // Stands in for a `useFocusEffect` cleanup in the consumer - it runs after the hook's own cleanup.
    useEffect(
      () => () => {
        try {
          sharedObject.pause();
        } catch (error) {
          pauseErrors.push(error);
        }
      },
      [sharedObject]
    );
  });

  unmount();

  expect(pauseErrors).toEqual([]);

  await flushMicrotasks();
  expect(object.releaseCount).toBe(1);
});

it('releases the object exactly once on unmount', async () => {
  const object = createTestSharedObject();
  const { unmount } = renderHook(() => useReleasingSharedObject(() => object, []));

  unmount();
  await flushMicrotasks();

  expect(object.releaseCount).toBe(1);
});

it('releases the previous object when the dependencies change', () => {
  const objects = {
    first: createTestSharedObject(),
    second: createTestSharedObject(),
  };

  type Props = { dependency: keyof typeof objects };

  const { rerender } = renderHook(
    ({ dependency }: Props) => useReleasingSharedObject(() => objects[dependency], [dependency]),
    { initialProps: { dependency: 'first' } as Props }
  );

  expect(objects.first.releaseCount).toBe(0);

  rerender({ dependency: 'second' });

  expect(objects.first.releaseCount).toBe(1);
  expect(objects.second.releaseCount).toBe(0);
});
