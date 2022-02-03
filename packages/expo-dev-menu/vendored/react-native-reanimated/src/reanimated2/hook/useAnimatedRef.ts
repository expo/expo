import { Component, RefObject, useRef } from 'react';
import { getTag } from '../NativeMethods';
import { useSharedValue } from './useSharedValue';

interface RefObjectFunction<T> {
  current: T | null;
  (component: T): number;
}

export function useAnimatedRef<T extends Component>(): RefObject<T> {
  const tag = useSharedValue<number | null>(-1);
  const ref = useRef<RefObject<T>>();

  if (!ref.current) {
    const fun: RefObjectFunction<T> = <RefObjectFunction<T>>(
      function (component) {
        'worklet';
        // enters when ref is set by attaching to a component
        if (component) {
          tag.value = getTag(component);
          fun.current = component;
        }
        return tag.value;
      }
    );

    Object.defineProperty(fun, 'current', {
      value: null,
      writable: true,
      enumerable: false,
    });
    ref.current = fun;
  }

  return ref.current;
}
