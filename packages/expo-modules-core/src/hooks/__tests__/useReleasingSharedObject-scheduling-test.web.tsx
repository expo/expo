/** @jest-environment jsdom */

import { StrictMode, useEffect, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { SharedObject } from '../../SharedObject';
import { useReleasingSharedObjectWithLifecycle } from '../useReleasingSharedObjectWithLifecycle';

class TestSharedObject extends SharedObject {
  released = false;
  release = jest.fn(() => {
    this.released = true;
  });
}

// Deliberately use real ReactDOM scheduling without act(): act flushes passive effects early
// and would hide a release occurring between insertion cleanup and passive consumer cleanup.
it.each(['replace', 'remove'] as const)(
  'keeps the object alive for deferred passive cleanup on %s',
  async (operation) => {
    jest.useRealTimers();
    const objects: TestSharedObject[] = [];
    const cleanupStates: boolean[] = [];
    let cleanupWasDeferred = false;
    let finishMount!: () => void;
    let finishUpdate!: () => void;
    const mounted = new Promise<void>((resolve) => {
      finishMount = resolve;
    });
    const updated = new Promise<void>((resolve) => {
      finishUpdate = resolve;
    });

    function Consumer({ object }: { object: TestSharedObject }) {
      useEffect(
        () => () => {
          cleanupStates.push(object.released);
        },
        [object]
      );
      return null;
    }
    function Owner({ version }: { version: number }) {
      const object = useReleasingSharedObjectWithLifecycle(
        {
          factory: () => {
            const object = new TestSharedObject();
            objects.push(object);
            return object;
          },
        },
        [version]
      );
      return <Consumer object={object} />;
    }
    function App({ version }: { version: number }) {
      useLayoutEffect(() => {
        if (version === 1) {
          const previousCleanupCount = cleanupStates.length;
          Promise.resolve().then(() => {
            cleanupWasDeferred = cleanupStates.length === previousCleanupCount;
          });
        }
      }, [version]);
      useEffect(() => {
        (version === 0 ? finishMount : finishUpdate)();
      }, [version]);
      return operation === 'remove' && version === 1 ? null : <Owner version={version} />;
    }

    const container = document.createElement('div');
    const root = createRoot(container);
    let unmounted = false;
    try {
      root.render(
        <StrictMode>
          <App version={0} />
        </StrictMode>
      );
      await mounted;
      cleanupStates.length = 0;
      root.render(
        <StrictMode>
          <App version={1} />
        </StrictMode>
      );
      await updated;
      // Allow all release microtasks queued by the passive flush to finish.
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(cleanupWasDeferred).toBe(true);
      expect(cleanupStates.length).toBeGreaterThan(0);
      expect(cleanupStates).not.toContain(true);
      expect(objects[0]!.release).toHaveBeenCalledTimes(1);
      if (operation === 'replace') expect(objects[1]!.release).not.toHaveBeenCalled();

      root.unmount();
      unmounted = true;
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(cleanupStates).not.toContain(true);
      for (const object of objects) expect(object.release).toHaveBeenCalledTimes(1);
    } finally {
      if (!unmounted) root.unmount();
      container.remove();
    }
  }
);
