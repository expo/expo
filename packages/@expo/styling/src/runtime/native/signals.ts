import { useMemo, useEffect, useState } from "react";

import { Signal } from "../../types";
/*
 * This file handles the reactivity of our style.
 * The problem is that styles can conditionally use dynamic units (e.g. rem), and they
 * might not be on the top level, e.g. var(var(var(10rem)))
 * They also might be inside media/container queries and/or never used!
 *
 * Because Signals track their own usage, it means we can keep the complexity in this
 * file and keep the rest of the codebase relatively clean.
 *
 * We are using eager signals with the MobX stale algorithm.
 *
 * This implementation is heavily based on the following resources:
 * - https://dev.to/ryansolid/building-a-reactive-library-from-scratch-1i0p
 * - https://medium.com/hackernoon/becoming-fully-reactive-an-in-depth-explanation-of-mobservable-55995262a254
 * - https://github.com/fabiospampinato/flimsy
 *
 * Batching is not implemented. Nesting computations is supported but not used.
 */

interface Computation<T = unknown> {
  /** The function that is being tracked */
  fn: () => T;
  /** The number of dependencies waiting to be resolved */
  waiting: number;
  /** Has something actually changed */
  fresh: boolean;
  /** Where the result of fn() is stored */
  signal: Signal<T>;
  /** Execute fn() in a new context */
  execute(): void;
  /**
   * Get the signal value without subscribing
   * TODO: Is this needed?
   */
  snapshot(): T;
  /** The subscriptions dependancies */
  dependencies: Set<Set<Computation | (() => void)>>;
  /** Manually subscribe to the computation outside of a context */
  subscribe(callback: () => void): () => void;
  /** Update the fn() and re-execute */
  update(fn: () => T): void;
  /**
   * Propagating change of the "stale" status to every observer of this signal
   * +1 means a signal you depend on is stale, wait for it
   * -1 means a signal you depend on just became non-stale, maybe you can update yourself now if you are not waiting for anything else
   * The "fresh" value tells observers whether something actually changed or not
   * If nothing changed, not for this signal nor for any other signal that a computation is listening to, then the computation will just not be re-executed, for performance
   * If at least one signal changed the computation will eventually be re-executed
   */
  stale(change: 1 | -1, fresh: boolean): void;
}

const context: Computation[] = [];

/**
 * Signals make values reactive, as going through function calls to get/set values for them enables the automatic
 * dependency tracking and computation re-execution
 *
 * @typedef T - the value of the signal
 * @returns {Signal<T>} - the signal
 */
export function createSignal<T = unknown>(value: T): Signal<T> {
  const subscriptions = new Set<Computation | (() => void)>();

  const get = () => {
    const running = context[context.length - 1];
    if (running) {
      subscriptions.add(running);
      running.dependencies.add(subscriptions);
    }
    return value;
  };

  const snapshot = () => value;

  const set = (nextValue: T) => {
    if (Object.is(value, nextValue)) return;

    value = nextValue;

    stale(1, true);
    stale(-1, true);
  };

  const stale = (change: 1 | -1, fresh: boolean): void => {
    for (const subscriber of [...subscriptions]) {
      if (typeof subscriber === "function") {
        subscriber();
      } else {
        subscriber.stale(change, fresh);
      }
    }
  };

  const subscribe = (callback: () => void) => {
    subscriptions.add(callback);
    return () => {
      subscriptions.delete(callback);
    };
  };

  return { get, set, stale, subscribe, snapshot };
}

function cleanup(running: Computation) {
  for (const dep of running.dependencies) {
    dep.delete(running);
  }
  running.dependencies.clear();
}

function createComputation<T = unknown>(fn: () => T) {
  const computation: Computation<T> = {
    fn,
    waiting: 0,
    fresh: false,
    signal: createSignal(undefined) as Signal<T>,
    dependencies: new Set(),
    snapshot() {
      return computation.signal.snapshot();
    },
    subscribe(callback: () => void) {
      return this.signal.subscribe(callback);
    },
    execute() {
      cleanup(computation);
      context.push(computation);

      this.waiting = 0;
      this.fresh = false;

      this.signal.set(this.fn());
      context.pop();
    },
    update(fn: () => T) {
      if (fn === this.fn) return;
      this.fn = fn;
      this.execute();
    },
    stale(change: 1 | -1, fresh: boolean) {
      if (!this.waiting && change < 0) return;

      if (!this.waiting && change > 0) {
        this.signal.stale(1, false);
      }

      this.waiting += change;
      this.fresh ||= fresh;

      if (!this.waiting) {
        this.waiting = 0;

        if (this.fresh) {
          this.execute();
        }

        this.signal.stale(-1, false);
      }
    },
  };

  computation.execute();

  return computation;
}

/**
 * Runs a computation function and returns its result.
 * This function also takes an array of dependencies, and will re-run the computation if any of these dependencies have changed.
 * It also takes a callback to rerender the component if the computation result changes.
 *
 * @typeParam T - the return type of the computation function
 * @param {() => T} fn - the computation function to be run
 * @param {unknown[]} dependencies - an array of dependencies that may change the computation result
 * @param {() => void} rerender - a callback to rerender the component if the computation result changes
 * @returns {T} - the result of the computation function
 */
export function useComputation<T>(
  fn: () => T,
  dependencies: unknown[],
  rerender: () => void
): T {
  const [computation] = useState(() => createComputation(fn));
  useMemo(() => computation.update(fn), dependencies);
  useEffect(() => computation.subscribe(rerender), [computation]);
  return computation.snapshot();
}
