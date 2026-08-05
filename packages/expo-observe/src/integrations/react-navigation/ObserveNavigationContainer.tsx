import { forwardRef, useImperativeHandle, type ComponentProps, type Ref } from 'react';

import { useAssertValueDoesNotChange } from '../../useAssertValueDoesNotChange';
import { ObserveNavigationProvider } from './ObserveNavigationProvider';
import { isInitialized } from './init';
import { optionalReactNavigation } from './reactNavigation';
import type { NavigationContainerRefLike } from './types';

const NavigationContainer = optionalReactNavigation?.NavigationContainer;
const useNavigationContainerRef = optionalReactNavigation?.useNavigationContainerRef;

type NavigationContainerProps = ComponentProps<NonNullable<typeof NavigationContainer>>;

export type ObserveNavigationContainerProps = NavigationContainerProps;

function ObserveNavigationContainerImpl(
  props: ObserveNavigationContainerProps,
  forwardedRef: Ref<NavigationContainerRefLike>
) {
  if (!NavigationContainer || !useNavigationContainerRef) {
    throw new Error(
      '[expo-observe] ObserveNavigationContainer requires @react-navigation/native, ' +
        "but the package couldn't be resolved. Install @react-navigation/native, or " +
        "remove the React Navigation integration if it's not needed."
    );
  }
  const { children, ...rest } = props;
  const navigationRef = useNavigationContainerRef();

  useImperativeHandle(forwardedRef, () => navigationRef, [navigationRef]);

  useAssertValueDoesNotChange(
    isInitialized(),
    `[expo-observe] React Navigation integration was toggled after ObserveNavigationContainer mounted. Call \`Observe.configure({ integrations: { 'react-navigation': true } })\` before rendering ObserveNavigationContainer.`
  );

  return (
    <ObserveNavigationProvider navigationRef={navigationRef}>
      <NavigationContainer
        {...rest}
        ref={navigationRef as unknown as NavigationContainerProps['ref']}>
        {children}
      </NavigationContainer>
    </ObserveNavigationProvider>
  );
}

export const ObserveNavigationContainer = forwardRef(ObserveNavigationContainerImpl);
