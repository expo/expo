import type { NavigationContainerRef } from '@react-navigation/native';
import { forwardRef, useImperativeHandle, type ComponentProps, type Ref } from 'react';

import { ObserveNavigationProvider } from './ObserveNavigationProvider';
import { isInitialized } from './init';
import { optionalReactNavigation } from './reactNavigation';
import { useAssertValueDoesNotChange } from '../../useAssertValueDoesNotChange';

const NavigationContainer = optionalReactNavigation?.NavigationContainer;
const useNavigationContainerRef = optionalReactNavigation?.useNavigationContainerRef;

type NavigationContainerProps = ComponentProps<NonNullable<typeof NavigationContainer>>;

export type ObserveNavigationContainerProps = NavigationContainerProps;

/**
 * Drop-in replacement for React Navigation's `NavigationContainer` (dynamic
 * configuration). It creates the navigation ref for you and delegates the
 * instrumentation to {@link ObserveNavigationProvider}, so the two share a
 * single code path. Pass a `linking` config to resolve a human-readable path
 * per screen; otherwise screens fall back to their `route.name`.
 */
function ObserveNavigationContainerImpl(
  props: ObserveNavigationContainerProps,
  forwardedRef: Ref<NavigationContainerRef<ReactNavigation.RootParamList>>
) {
  if (!NavigationContainer || !useNavigationContainerRef) {
    throw new Error(
      '[expo-observe] ObserveNavigationContainer requires @react-navigation/native, ' +
        "but the package couldn't be resolved. Install @react-navigation/native, or " +
        "remove the React Navigation integration if it's not needed."
    );
  }
  const { children, linking, ...rest } = props;
  const navigationRef = useNavigationContainerRef();

  useImperativeHandle(
    forwardedRef,
    () => navigationRef as NavigationContainerRef<ReactNavigation.RootParamList>,
    [navigationRef]
  );

  // Keep the container-specific message even though the provider asserts the
  // same invariant — the container's render runs first, so this is what the
  // user who reached for `ObserveNavigationContainer` actually sees.
  useAssertValueDoesNotChange(
    isInitialized(),
    `[expo-observe] React Navigation integration was toggled after ObserveNavigationContainer mounted. Call \`Observe.configure({ integrations: { 'react-navigation': true } })\` before rendering ObserveNavigationContainer.`
  );

  return (
    <ObserveNavigationProvider
      navigationRef={navigationRef as NavigationContainerRef<ReactNavigation.RootParamList>}
      linking={linking}>
      <NavigationContainer
        {...rest}
        linking={linking}
        ref={navigationRef as NavigationContainerProps['ref']}>
        {children}
      </NavigationContainer>
    </ObserveNavigationProvider>
  );
}

export const ObserveNavigationContainer = forwardRef(ObserveNavigationContainerImpl);
