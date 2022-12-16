import { MutableRefObject, useEffect, useRef } from 'react';
import { processColor } from '../Colors';
import {
  AnimatedStyle,
  NativeEvent,
  NestedObjectValues,
  StyleProps,
  WorkletFunction,
  AnimationObject,
} from '../commonTypes';
import { makeRemote } from '../core';
import { isWeb, isJest } from '../PlatformChecker';
import { colorProps } from '../UpdateProps';
import WorkletEventHandler from '../WorkletEventHandler';
import {
  Context,
  ContextWithDependencies,
  DependencyList,
} from './commonTypes';

interface Handler<T, TContext extends Context> extends WorkletFunction {
  (event: T, context: TContext): void;
}

interface Handlers<T, TContext extends Context> {
  [key: string]: Handler<T, TContext> | undefined;
}

export interface UseHandlerContext<TContext extends Context> {
  context: TContext;
  doDependenciesDiffer: boolean;
  useWeb: boolean;
}

export function useEvent<T extends NativeEvent<T>>(
  handler: (event: T) => void,
  eventNames: string[] = [],
  rebuild = false
): MutableRefObject<WorkletEventHandler<T> | null> {
  const initRef = useRef<WorkletEventHandler<T> | null>(null);
  if (initRef.current === null) {
    initRef.current = new WorkletEventHandler(handler, eventNames);
  } else if (rebuild) {
    initRef.current.updateWorklet(handler);
  }

  return initRef;
}

export function useHandler<T, TContext extends Context>(
  handlers: Handlers<T, TContext>,
  dependencies?: DependencyList
): UseHandlerContext<TContext> {
  const initRef = useRef<ContextWithDependencies<TContext> | null>(null);
  if (initRef.current === null) {
    initRef.current = {
      context: makeRemote({}),
      savedDependencies: [],
    };
  }

  useEffect(() => {
    return () => {
      initRef.current = null;
    };
  }, []);

  const { context, savedDependencies } = initRef.current;

  dependencies = buildDependencies(dependencies, handlers);

  const doDependenciesDiffer = !areDependenciesEqual(
    dependencies,
    savedDependencies
  );
  initRef.current.savedDependencies = dependencies;
  const useWeb = isWeb() || isJest();

  return { context, doDependenciesDiffer, useWeb };
}

// builds one big hash from multiple worklets' hashes
export function buildWorkletsHash(
  handlers: Record<string, WorkletFunction> | Array<WorkletFunction>
): string {
  return Object.values(handlers).reduce(
    (acc: string, worklet: WorkletFunction) =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      acc + worklet.__workletHash!.toString(),
    ''
  );
}

// builds dependencies array for gesture handlers
export function buildDependencies(
  dependencies: DependencyList,
  handlers: Record<string, WorkletFunction | undefined>
): Array<unknown> {
  const handlersList: WorkletFunction[] = Object.values(handlers).filter(
    (handler) => handler !== undefined
  ) as WorkletFunction[];
  if (!dependencies) {
    dependencies = handlersList.map((handler) => {
      return {
        workletHash: handler.__workletHash,
        closure: handler._closure,
      };
    });
  } else {
    dependencies.push(buildWorkletsHash(handlersList));
  }
  return dependencies;
}

// this is supposed to work as useEffect comparison
export function areDependenciesEqual(
  nextDeps: DependencyList,
  prevDeps: DependencyList
): boolean {
  function is(x: number, y: number) {
    /* eslint-disable no-self-compare */
    return (x === y && (x !== 0 || 1 / x === 1 / y)) || (x !== x && y !== y);
    /* eslint-enable no-self-compare */
  }
  const objectIs: (nextDeps: unknown, prevDeps: unknown) => boolean =
    typeof Object.is === 'function' ? Object.is : is;

  function areHookInputsEqual(
    nextDeps: DependencyList,
    prevDeps: DependencyList
  ): boolean {
    if (!nextDeps || !prevDeps || prevDeps.length !== nextDeps.length) {
      return false;
    }
    for (let i = 0; i < prevDeps.length; ++i) {
      if (!objectIs(nextDeps[i], prevDeps[i])) {
        return false;
      }
    }
    return true;
  }

  return areHookInputsEqual(nextDeps, prevDeps);
}

export function hasColorProps(updates: AnimatedStyle): boolean {
  const colorPropsSet = new Set(colorProps);
  for (const key in updates) {
    if (colorPropsSet.has(key)) {
      return true;
    }
  }
  return false;
}

export function parseColors(updates: AnimatedStyle): void {
  'worklet';
  for (const key in updates) {
    if (colorProps.indexOf(key) !== -1) {
      // value could be an animation in which case processColor will recognize it and will return undefined
      // -> in such a case we don't want to override style of that key
      const processedColor = processColor(updates[key]);
      if (processedColor !== undefined) {
        updates[key] = processedColor;
      }
    }
  }
}

export function canApplyOptimalisation(upadterFn: WorkletFunction): number {
  const FUNCTIONLESS_FLAG = 0b00000001;
  const STATEMENTLESS_FLAG = 0b00000010;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const optimalization = upadterFn.__optimalization!;
  return (
    optimalization & FUNCTIONLESS_FLAG && optimalization & STATEMENTLESS_FLAG
  );
}

export function isAnimated(prop: NestedObjectValues<AnimationObject>): boolean {
  'worklet';
  const propsToCheck: NestedObjectValues<AnimationObject>[] = [prop];
  while (propsToCheck.length > 0) {
    const currentProp: NestedObjectValues<AnimationObject> =
      propsToCheck.pop() as NestedObjectValues<AnimationObject>;
    if (Array.isArray(currentProp)) {
      for (const item of currentProp) {
        propsToCheck.push(item);
      }
    } else if (currentProp?.onFrame !== undefined) {
      return true;
    } else if (typeof currentProp === 'object') {
      for (const item of Object.values(currentProp)) {
        propsToCheck.push(item);
      }
    }
    // if none of the above, it's not the animated prop, check next one
  }

  // when none of the props were animated return false
  return false;
}

export function styleDiff<T extends AnimatedStyle>(
  oldStyle: AnimatedStyle,
  newStyle: AnimatedStyle
): Partial<T> {
  'worklet';
  const diff: any = {};
  for (const key in oldStyle) {
    if (newStyle[key] === undefined) {
      diff[key] = null;
    }
  }
  for (const key in newStyle) {
    const value = newStyle[key];
    const oldValue = oldStyle[key];

    if (isAnimated(value)) {
      // do nothing
      continue;
    }
    if (oldValue !== value) {
      diff[key] = value;
    }
  }
  return diff;
}

export function getStyleWithoutAnimations(newStyle: AnimatedStyle): StyleProps {
  'worklet';
  const diff: StyleProps = {};

  for (const key in newStyle) {
    const value = newStyle[key];
    if (isAnimated(value)) {
      continue;
    }
    diff[key] = value;
  }
  return diff;
}

export const validateAnimatedStyles = (styles: AnimatedStyle): void => {
  'worklet';
  if (typeof styles !== 'object') {
    throw new Error(
      `useAnimatedStyle has to return an object, found ${typeof styles} instead`
    );
  } else if (Array.isArray(styles)) {
    throw new Error(
      'useAnimatedStyle has to return an object and cannot return static styles combined with dynamic ones. Please do merging where a component receives props.'
    );
  }
};
