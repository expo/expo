import type {
  ZoomTransitionSourceContextProviderProps,
  ZoomTransitionTargetContextProviderProps,
} from './zoom-transition-context-providers.types';

export function ZoomTransitionSourceContextProvider({
  children,
}: ZoomTransitionSourceContextProviderProps) {
  return children;
}

export function ZoomTransitionTargetContextProvider({
  children,
}: ZoomTransitionTargetContextProviderProps) {
  return children;
}
