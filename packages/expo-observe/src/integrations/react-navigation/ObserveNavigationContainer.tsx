import {
  NavigationContainer,
  type NavigationContainerRef,
  useNavigationContainerRef,
} from '@react-navigation/native';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type ComponentProps,
  type Ref,
} from 'react';

import { attachActionListener } from './actionListener';
import { ObserveReactNavigationIntegrationContext } from './context';
import { createGetPathname } from './getPathname';
import { createStateChangeHandler } from './handleStateChange';
import { isInitialized } from './init';
import { createReactNavigationIntegrationStorage } from './storage';
import type { NavigationStateLike } from './types';
import { useAssertValueDoesNotChange } from '../../useAssertValueDoesNotChange';

type NavigationContainerProps = ComponentProps<typeof NavigationContainer>;

export type ObserveNavigationContainerProps = NavigationContainerProps;

function ObserveNavigationContainerImpl(
  props: ObserveNavigationContainerProps,
  forwardedRef: Ref<NavigationContainerRef<ReactNavigation.RootParamList>>
) {
  const { children, onStateChange, onReady, linking, ...rest } = props;
  const navigationRef = useNavigationContainerRef();
  const initialized = isInitialized();

  useImperativeHandle(
    forwardedRef,
    () => navigationRef as unknown as NavigationContainerRef<ReactNavigation.RootParamList>,
    [navigationRef]
  );

  const [internal] = useState(() => {
    if (!initialized) return null;
    const storage = createReactNavigationIntegrationStorage();
    const getPathname = createGetPathname(linking);
    return {
      storage,
      getPathname,
      handleStateChange: createStateChangeHandler(storage, getPathname, performance.now()),
    };
  });

  useAssertValueDoesNotChange(
    initialized,
    `[expo-observe] React Navigation integration was toggled after ObserveNavigationContainer mounted. Call \`ExpoObserve.configure({ integrations: { 'react-navigation': true } })\` before rendering ObserveNavigationContainer.`
  );

  useEffect(() => {
    if (!internal) return;
    return attachActionListener(navigationRef, internal.storage);
  }, [internal, navigationRef]);

  const onStateChangeMerged = useCallback<NonNullable<NavigationContainerProps['onStateChange']>>(
    (state) => {
      internal?.handleStateChange(state as unknown as NavigationStateLike | undefined);
      onStateChange?.(state);
    },
    [internal, onStateChange]
  );

  // React Navigation's `onStateChange` doesn't fire for the initial state, so
  // without this the first focused screen would never be recorded — every
  // subsequent revisit would then look like a cold focus.
  const onReadyMerged = useCallback<NonNullable<NavigationContainerProps['onReady']>>(() => {
    if (internal) {
      const rootState = navigationRef.getRootState() as unknown as
        | NavigationStateLike
        | undefined;
      if (rootState) {
        internal.handleStateChange(rootState);
      }
    }
    onReady?.();
  }, [internal, navigationRef, onReady]);

  const contextValue = useMemo(
    () => (internal ? { storage: internal.storage, getPathname: internal.getPathname } : null),
    [internal]
  );

  return (
    <NavigationContainer
      {...rest}
      linking={linking}
      ref={navigationRef as unknown as NavigationContainerProps['ref']}
      onStateChange={onStateChangeMerged}
      onReady={onReadyMerged}>
      <ObserveReactNavigationIntegrationContext.Provider value={contextValue}>
        {children}
      </ObserveReactNavigationIntegrationContext.Provider>
    </NavigationContainer>
  );
}

export const ObserveNavigationContainer = forwardRef(ObserveNavigationContainerImpl);
