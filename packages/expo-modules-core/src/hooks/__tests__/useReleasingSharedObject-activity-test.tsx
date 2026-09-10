import { act, render } from '@testing-library/react-native';
import { Activity, memo, useEffect } from 'react';

import { SharedObject } from '../../SharedObject';
import { useReleasingSharedObject } from '../useReleasingSharedObject';
import { useReleasingSharedObjectWithLifecycle } from '../useReleasingSharedObjectWithLifecycle';

class TestSharedObject extends SharedObject {
  released = false;
  release = jest.fn(() => {
    this.released = true;
  });

  read() {
    if (this.released) throw new Error('Read from a released shared object');
    return this;
  }
}

type Mode = 'visible' | 'hidden';

async function flushEffects() {
  await act(async () => {});
}

afterEach(async () => {
  await flushEffects();
  jest.restoreAllMocks();
});

it('preserves the object across repeated hide/show without rerendering the content', async () => {
  const factory = jest.fn(() => new TestSharedObject());
  const cleanup = jest.fn((object: TestSharedObject) => object.read());
  let committed!: TestSharedObject;
  const Content = memo(function Content() {
    const object = useReleasingSharedObject(factory, []);
    object.read();
    useEffect(() => {
      committed = object.read();
      return () => {
        cleanup(object);
      };
    }, [object]);
    return null;
  });
  // A stable, memoized child must survive effect reconnection without relying on another render.
  const content = <Content />;
  const tree = (mode: Mode) => <Activity mode={mode}>{content}</Activity>;
  const screen = render(tree('visible'), { concurrentRoot: true });
  const original = committed;

  for (let cycle = 0; cycle < 2; cycle++) {
    screen.rerender(tree('hidden'));
    await flushEffects();
    expect(original.release).not.toHaveBeenCalled();

    screen.rerender(tree('visible'));
    await flushEffects();
    expect(committed).toBe(original);
    expect(original.release).not.toHaveBeenCalled();
    expect(factory).toHaveBeenCalledTimes(1);
  }
  screen.unmount();
  await flushEffects();
  expect(original.release).toHaveBeenCalledTimes(1);
  expect(cleanup).toHaveBeenCalledTimes(3);
});

it('keeps the hidden object alive when its pending update settles', async () => {
  let finishUpdate!: () => void;
  const pending = new Promise<void>((resolve) => {
    finishUpdate = resolve;
  });
  const update = jest.fn(() => pending);
  let committed!: TestSharedObject;
  const Content = memo(function Content({ source }: { source: number }) {
    const object = useReleasingSharedObjectWithLifecycle(
      {
        factory: () => new TestSharedObject(),
        shouldRecreate: () => false,
        update,
      },
      [source]
    );
    useEffect(() => {
      committed = object.read();
    }, [object]);
    return null;
  });
  const tree = (mode: Mode, source: number) => (
    <Activity mode={mode}>
      <Content source={source} />
    </Activity>
  );
  const screen = render(tree('visible', 0), { concurrentRoot: true });
  const original = committed;
  screen.rerender(tree('visible', 1));
  screen.rerender(tree('hidden', 1));
  await flushEffects();
  expect(original.release).not.toHaveBeenCalled();

  await act(async () => finishUpdate());
  expect(original.release).not.toHaveBeenCalled();
  screen.rerender(tree('visible', 1));
  await flushEffects();
  expect(committed).toBe(original);
  expect(original.release).not.toHaveBeenCalled();
  expect(update).toHaveBeenCalledTimes(1);

  screen.unmount();
  await flushEffects();
  expect(original.release).toHaveBeenCalledTimes(1);
});

// react skips insertion cleanup when deleting a hidden Activity.
// This causes failure to release shared objects when unmounting a hidden Activity.
// Remove `failing` once fix is found - until then SharedObjects can't auto-release
// when a hidden Activity is unmounted
it.failing.each<Mode>(['visible', 'hidden'])(
  'releases on hidden deletion after mounting %s',
  async (initialMode) => {
    const factory = jest.fn(() => new TestSharedObject());
    function Content() {
      useReleasingSharedObject(factory, []);
      return null;
    }
    const tree = (mode: Mode) => (
      <Activity mode={mode}>
        <Content />
      </Activity>
    );
    const screen = render(tree(initialMode), { concurrentRoot: true });
    await flushEffects();
    expect(factory).toHaveBeenCalledTimes(1);
    const object = factory.mock.results[0]!.value;
    if (initialMode === 'visible') screen.rerender(tree('hidden'));
    await flushEffects();
    expect(object.release).not.toHaveBeenCalled();

    screen.unmount();
    await flushEffects();
    expect(object.release).toHaveBeenCalledTimes(1);
  }
);

it.each([0, 2])(
  'defers hidden dependency changes until revealing source %i',
  async (finalSource) => {
    const factory = jest.fn(() => new TestSharedObject());
    const update = jest.fn();
    let current!: TestSharedObject;
    function Content({ source }: { source: number }) {
      current = useReleasingSharedObjectWithLifecycle(
        { factory, shouldRecreate: () => false, update },
        [source]
      );
      return null;
    }
    const tree = (mode: Mode, source: number) => (
      <Activity mode={mode}>
        <Content source={source} />
      </Activity>
    );
    const screen = render(tree('visible', 0), { concurrentRoot: true });
    const original = current;
    screen.rerender(tree('hidden', 0));
    screen.rerender(tree('hidden', 1));
    await flushEffects();
    screen.rerender(tree('hidden', finalSource));
    await flushEffects();
    expect(current).toBe(original);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
    expect(original.release).not.toHaveBeenCalled();

    screen.rerender(tree('visible', finalSource));
    await flushEffects();
    expect(current).toBe(original);
    expect(update).toHaveBeenCalledTimes(finalSource === 0 ? 0 : 1);
    if (finalSource !== 0) {
      expect(update).toHaveBeenCalledWith(original, {
        previousDependencies: [0],
        dependencies: [finalSource],
      });
    }
    screen.unmount();
    await flushEffects();
    expect(original.release).toHaveBeenCalledTimes(1);
  }
);
