import type {
  NavigationContainerRef,
  ParamListBase,
} from '@react-navigation/core';

export function useBackButton(
  _: React.RefObject<NavigationContainerRef<ParamListBase> | null>
) {
  // No-op
  // BackHandler is not available on web
}
