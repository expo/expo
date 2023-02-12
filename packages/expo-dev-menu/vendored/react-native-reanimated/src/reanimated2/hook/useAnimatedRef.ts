import { Component, useRef } from 'react';
import { getTag } from '../NativeMethods';
import { useSharedValue } from './useSharedValue';
import { RefObjectFunction } from './commonTypes';

export function useAnimatedRef<T extends Component>(): RefObjectFunction<T> {
  const tag = useSharedValue<number | null>(-1);
  const ref = useRef<RefObjectFunction<T>>();

  if (!ref.current) {
    const fun: RefObjectFunction<T> = <RefObjectFunction<T>>((component) => {
      'worklet';
      // enters when ref is set by attaching to a component
      if (component) {
        tag.value = getTag(component);
        fun.current = component;
      }
      return tag.value;
    });

    Object.defineProperty(fun, 'current', {
      value: null,
      writable: true,
      enumerable: false,
    });
    ref.current = fun;
  }

  return ref.current;
}
