import { act, renderHook } from '@testing-library/react-native';
import { Suspense, startTransition, useEffect, type PropsWithChildren } from 'react';

import { SharedObject } from '../../SharedObject';
import { useReleasingSharedObject } from '../useReleasingSharedObject';
import { useReleasingSharedObjectWithLifecycle } from '../useReleasingSharedObjectWithLifecycle';

class TestSharedObject extends SharedObject {
  released = false;
  release = jest.fn(() => {
    this.released = true;
  });

  read() {
    if (this.released) {
      throw new Error('Shared object was already released');
    }
    return this;
  }
}

// React 19.2 only replays effects when StrictMode is enabled at the renderer's root.
// Testing Library forwards this option to react-test-renderer.
const strictRootOptions = { concurrentRoot: true, unstable_strictMode: true };

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function SuspenseWrapper({ children }: PropsWithChildren) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

async function flushCleanup() {
  await act(async () => {
    await Promise.resolve();
  });
}

afterEach(async () => {
  await flushCleanup();
  jest.restoreAllMocks();
});

it('keeps the object alive through StrictMode effect replay and consumer cleanup', async () => {
  const factory = jest.fn(() => new TestSharedObject());
  const setup = jest.fn();
  const cleanup = jest.fn();
  const { result, unmount } = renderHook(() => {
    const object = useReleasingSharedObject(factory, []);
    useEffect(() => {
      setup(object.read());
      return () => cleanup(object.read());
    }, [object]);
    return object;
  }, strictRootOptions);

  await flushCleanup();
  const object = result.current;
  expect(factory).toHaveBeenCalledTimes(1);
  expect(setup).toHaveBeenCalledTimes(2);
  expect(cleanup).toHaveBeenCalledTimes(1);
  expect(object.release).not.toHaveBeenCalled();

  unmount();
  await flushCleanup();
  expect(cleanup).toHaveBeenCalledTimes(2);
  expect(object.release).toHaveBeenCalledTimes(1);
});

it('preserves identity with Object.is dependencies and releases every committed replacement after render', async () => {
  const factory = jest.fn(() => new TestSharedObject());
  let previous: TestSharedObject | undefined;
  const { result, rerender, unmount } = renderHook(
    ({ source }: { source: number }) => {
      const object = useReleasingSharedObject(factory, [source]);
      previous?.read();
      return object;
    },
    { initialProps: { source: NaN }, ...strictRootOptions }
  );
  previous = result.current;
  rerender({ source: NaN });
  expect(result.current).toBe(previous);
  expect(factory).toHaveBeenCalledTimes(1);

  const objects = [result.current];
  // Commit several replacements without flushing release microtasks between them.
  for (const source of [0, -0, 1]) {
    rerender({ source });
    expect(result.current).not.toBe(previous);
    previous = result.current;
    objects.push(result.current);
  }
  expect(factory).toHaveBeenCalledTimes(4);
  await flushCleanup();
  for (const object of objects.slice(0, -1)) expect(object.release).toHaveBeenCalledTimes(1);
  expect(result.current.release).not.toHaveBeenCalled();

  unmount();
  await flushCleanup();
  for (const object of objects) expect(object.release).toHaveBeenCalledTimes(1);
});

it('updates once per committed dependency change using the latest callbacks', async () => {
  const factory = jest.fn(() => new TestSharedObject());
  const firstRelease = jest.fn();
  const secondRelease = jest.fn();
  const firstUpdate = jest.fn();
  const secondUpdate = jest.fn();
  const { result, rerender, unmount } = renderHook(
    ({ source, release, update }: { source: number; release: jest.Mock; update: jest.Mock }) =>
      useReleasingSharedObjectWithLifecycle(
        { factory, shouldRecreate: () => false, release, update },
        [source]
      ),
    {
      initialProps: { source: 0, release: firstRelease, update: firstUpdate },
      ...strictRootOptions,
    }
  );
  const object = result.current;
  expect(firstUpdate).not.toHaveBeenCalled();

  rerender({ source: 1, release: firstRelease, update: secondUpdate });
  // Changing callbacks alone must refresh release without replaying the update.
  rerender({ source: 1, release: secondRelease, update: secondUpdate });
  await flushCleanup();
  expect(result.current).toBe(object);
  expect(factory).toHaveBeenCalledTimes(1);
  expect(object.release).not.toHaveBeenCalled();
  expect(firstRelease).not.toHaveBeenCalled();
  expect(secondRelease).not.toHaveBeenCalled();
  expect(firstUpdate).not.toHaveBeenCalled();
  expect(secondUpdate).toHaveBeenCalledTimes(1);
  expect(secondUpdate).toHaveBeenCalledWith(object, {
    previousDependencies: [0],
    dependencies: [1],
  });

  unmount();
  await flushCleanup();
  expect(firstRelease).not.toHaveBeenCalled();
  expect(secondRelease).toHaveBeenCalledTimes(1);
  expect(secondRelease).toHaveBeenCalledWith(object);
  expect(object.release).not.toHaveBeenCalled();
});

it.each([
  { order: [0, 2, 1], settleBeforeUnmount: true },
  { order: [2, 1, 0], settleBeforeUnmount: false },
])(
  'waits for all updates in order $order (first settles before unmount: $settleBeforeUnmount)',
  async ({ order, settleBeforeUnmount }) => {
    const jobs = [deferred(), deferred(), deferred()];
    const error = new Error('One update failed');
    const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const update = jest
      .fn()
      .mockReturnValueOnce(jobs[0]!.promise)
      .mockReturnValueOnce(jobs[1]!.promise)
      .mockReturnValueOnce(jobs[2]!.promise);
    const { result, rerender, unmount } = renderHook(
      ({ source }: { source: number }) =>
        useReleasingSharedObjectWithLifecycle(
          {
            factory: () => new TestSharedObject(),
            shouldRecreate: () => false,
            update,
          },
          [source]
        ),
      { initialProps: { source: 0 }, ...strictRootOptions }
    );
    const object = result.current;
    for (const source of [1, 2, 3]) rerender({ source });
    expect(update).toHaveBeenCalledTimes(3);
    if (!settleBeforeUnmount) unmount();
    await flushCleanup();
    expect(object.release).not.toHaveBeenCalled();

    // Exercise both rejection as the final task and rejection while another task is pending.
    for (const [position, index] of order.entries()) {
      if (index === 1) jobs[index]!.reject(error);
      else jobs[index]!.resolve();
      await flushCleanup();
      expect(object.release).toHaveBeenCalledTimes(position === 2 ? 1 : 0);
      if (position === 0 && settleBeforeUnmount) {
        unmount();
        await flushCleanup();
        expect(object.release).not.toHaveBeenCalled();
      }
    }
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(error);
  }
);

it.each(['original', 'replacement'] as const)(
  'releases the %s independently with its own callback when both objects have pending updates',
  async (firstToFinish) => {
    const originalRelease = jest.fn((object: TestSharedObject) => object.release());
    const replacementRelease = jest.fn((object: TestSharedObject) => object.release());
    const originalUpdate = deferred();
    const replacementUpdate = deferred();
    const { result, rerender, unmount } = renderHook(
      ({ kind, source }: { kind: number; source: number }) =>
        useReleasingSharedObjectWithLifecycle(
          {
            factory: () => new TestSharedObject(),
            shouldRecreate: (_, { previousDependencies, dependencies }) =>
              previousDependencies[0] !== dependencies[0],
            update: () => (kind === 0 ? originalUpdate.promise : replacementUpdate.promise),
            release: kind === 0 ? originalRelease : replacementRelease,
          },
          [kind, source]
        ),
      { initialProps: { kind: 0, source: 0 }, ...strictRootOptions }
    );
    const original = result.current;
    rerender({ kind: 0, source: 1 });
    rerender({ kind: 1, source: 0 });
    const replacement = result.current;
    expect(replacement).not.toBe(original);
    rerender({ kind: 1, source: 1 });
    unmount();
    await flushCleanup();
    expect(original.release).not.toHaveBeenCalled();
    expect(replacement.release).not.toHaveBeenCalled();

    const [firstObject, firstUpdate, secondObject, secondUpdate] =
      firstToFinish === 'original'
        ? ([original, originalUpdate, replacement, replacementUpdate] as const)
        : ([replacement, replacementUpdate, original, originalUpdate] as const);
    firstUpdate.resolve();
    await flushCleanup();
    expect(firstObject.release).toHaveBeenCalledTimes(1);
    expect(secondObject.release).not.toHaveBeenCalled();

    secondUpdate.resolve();
    await flushCleanup();
    expect(firstObject.release).toHaveBeenCalledTimes(1);
    expect(secondObject.release).toHaveBeenCalledTimes(1);
    expect(originalRelease).toHaveBeenCalledTimes(1);
    expect(originalRelease).toHaveBeenCalledWith(original);
    expect(replacementRelease).toHaveBeenCalledTimes(1);
    expect(replacementRelease).toHaveBeenCalledWith(replacement);
  }
);

it('does not apply an interrupted render or treat its dependencies as committed', async () => {
  const never = new Promise<void>(() => {});
  const update = jest.fn();
  const { result, rerender } = renderHook(
    ({ source, suspend }: { source: number; suspend: boolean }) => {
      const object = useReleasingSharedObjectWithLifecycle(
        {
          factory: () => new TestSharedObject(),
          shouldRecreate: () => false,
          update,
        },
        [source]
      );
      if (suspend) throw never;
      return object;
    },
    {
      initialProps: { source: 0, suspend: false },
      wrapper: SuspenseWrapper,
      concurrentRoot: true,
    }
  );
  const object = result.current;
  act(() => {
    startTransition(() => rerender({ source: 1, suspend: true }));
  });
  await flushCleanup();
  expect(object.release).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();

  rerender({ source: 2, suspend: false });
  expect(result.current).toBe(object);
  expect(update).toHaveBeenCalledTimes(1);
  expect(update).toHaveBeenCalledWith(object, {
    previousDependencies: [0],
    dependencies: [2],
  });
});

it('does not reconsider unchanged committed dependencies after an abandoned replacement', async () => {
  const never = new Promise<void>(() => {});
  const factory = jest.fn(() => new TestSharedObject());
  const shouldRecreate = jest.fn(() => true);
  const { result, rerender, unmount } = renderHook(
    ({ source, suspend }: { source: number; suspend: boolean }) => {
      const object = useReleasingSharedObjectWithLifecycle({ factory, shouldRecreate }, [source]);
      if (suspend) throw never;
      return object;
    },
    {
      initialProps: { source: 0, suspend: false },
      wrapper: SuspenseWrapper,
      concurrentRoot: true,
    }
  );
  const original = result.current;
  expect(shouldRecreate).not.toHaveBeenCalled();
  act(() => {
    startTransition(() => rerender({ source: 1, suspend: true }));
  });
  await flushCleanup();
  expect(factory).toHaveBeenCalledTimes(2);
  expect(shouldRecreate).toHaveBeenCalledWith(original, {
    previousDependencies: [0],
    dependencies: [1],
  });
  shouldRecreate.mockClear();

  rerender({ source: 0, suspend: false });
  await flushCleanup();
  expect(result.current).toBe(original);
  expect(factory).toHaveBeenCalledTimes(2);
  expect(shouldRecreate).not.toHaveBeenCalled();
  expect(original.release).not.toHaveBeenCalled();
  unmount();
  await flushCleanup();
  expect(original.release).toHaveBeenCalledTimes(1);
});

it('does not use a release callback from an abandoned render', async () => {
  const never = new Promise<void>(() => {});
  const committedRelease = jest.fn();
  const abandonedRelease = jest.fn();
  const { result, rerender, unmount } = renderHook(
    ({ release, suspend }: { release: jest.Mock; suspend: boolean }) => {
      const object = useReleasingSharedObjectWithLifecycle(
        { factory: () => new TestSharedObject(), release },
        []
      );
      if (suspend) throw never;
      return object;
    },
    {
      initialProps: { release: committedRelease, suspend: false },
      wrapper: SuspenseWrapper,
      concurrentRoot: true,
    }
  );
  const original = result.current;
  act(() => {
    startTransition(() => rerender({ release: abandonedRelease, suspend: true }));
  });
  await flushCleanup();
  unmount();
  await flushCleanup();
  expect(abandonedRelease).not.toHaveBeenCalled();
  expect(committedRelease).toHaveBeenCalledTimes(1);
  expect(committedRelease).toHaveBeenCalledWith(original);
});

it('logs a custom release error once without interrupting consumer cleanup', async () => {
  const error = new Error('Release failed');
  const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
  const release = jest.fn(() => {
    throw error;
  });
  const cleanup = jest.fn();
  const { unmount } = renderHook(() => {
    const object = useReleasingSharedObjectWithLifecycle(
      { factory: () => new TestSharedObject(), release },
      []
    );
    useEffect(() => () => cleanup(object.read()), [object]);
  }, strictRootOptions);

  await flushCleanup();
  expect(release).not.toHaveBeenCalled();
  unmount();
  await flushCleanup();
  expect(cleanup).toHaveBeenCalledTimes(2);
  expect(release).toHaveBeenCalledTimes(1);
  expect(logError).toHaveBeenCalledTimes(1);
  expect(logError).toHaveBeenCalledWith(error);
});

it('creates from a null resource even when shouldRecreate would keep an existing object', async () => {
  // useWorkletProp already returns null despite the hook's non-nullable generic constraint.
  const factory = jest.fn(
    (source: number): TestSharedObject => (source < 0 ? null! : new TestSharedObject())
  );
  const shouldRecreate = jest.fn((_, { dependencies }) => dependencies[0] < 0);
  const update = jest.fn();
  const release = jest.fn((object: TestSharedObject) => object.release());
  const { result, rerender, unmount } = renderHook(
    ({ source }: { source: number }) =>
      useReleasingSharedObjectWithLifecycle(
        { factory: () => factory(source), shouldRecreate, update, release },
        [source]
      ),
    { initialProps: { source: -1 }, ...strictRootOptions }
  );
  expect(result.current).toBeNull();
  rerender({ source: -1 });
  expect(factory).toHaveBeenCalledTimes(1);

  rerender({ source: 0 });
  const object = result.current;
  expect(object).toBeInstanceOf(TestSharedObject);
  expect(shouldRecreate).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
  rerender({ source: 1 });
  expect(result.current).toBe(object);
  expect(update).toHaveBeenCalledTimes(1);

  rerender({ source: -1 });
  expect(result.current).toBeNull();
  await flushCleanup();
  expect(release).toHaveBeenCalledTimes(1);
  expect(release).toHaveBeenCalledWith(object);
  unmount();
  await flushCleanup();
  expect(release).toHaveBeenCalledTimes(1);
});
