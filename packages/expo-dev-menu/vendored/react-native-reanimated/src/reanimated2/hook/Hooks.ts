import { useCallback } from 'react';
import { DependencyList } from './commonTypes';
import { useAnimatedStyle } from './useAnimatedStyle';

// TODO: we should make sure that when useAP is used we are not assigning styles
// when you need styles to animated you should always use useAS
export const useAnimatedProps = useAnimatedStyle;

export function useWorkletCallback<A extends unknown[], R>(
  fun: (...args: A) => R,
  deps?: DependencyList
): (...args: Parameters<typeof fun>) => R {
  return useCallback(fun, deps ?? []);
}

export { useEvent, useHandler } from './utils';
