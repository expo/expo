import React from 'react';
import { I18nManager } from 'react-native';

import { RouterConfigContext } from '../global-state/routerConfigContext';
import { BaseNavigationContainer } from '../react-navigation/core/BaseNavigationContainer';
import type {
  DocumentTitleOptions,
  LinkingOptions,
  LocaleDirection,
  NavigationContainerProps,
  NavigationContainerRef,
  ParamListBase,
} from '../react-navigation/native';
import {
  DefaultTheme,
  LinkingContext,
  LocaleDirContext,
  ThemeProvider,
} from '../react-navigation/native';
import { getPathFromState } from './getPathFromState';
import { getStateFromPath } from './getStateFromPath';
import { useBackButton } from './useBackButton';
import { useDocumentTitle } from './useDocumentTitle';
import { useLinking } from './useLinking';
import { useThenable } from './useThenable';
import { validatePathConfig } from './validatePathConfig';

declare global {
  // eslint-disable-next-line no-var
  var REACT_NAVIGATION_DEVTOOLS: WeakMap<
    NavigationContainerRef<any>,
    { readonly linking: LinkingOptions<any> }
  >;
}

globalThis.REACT_NAVIGATION_DEVTOOLS = new WeakMap();

type Props<ParamList extends object> = Omit<NavigationContainerProps, 'initialState'> & {
  direction?: LocaleDirection;
  linking?: LinkingOptions<ParamList>;
  fallback?: React.ReactNode;
  documentTitle?: DocumentTitleOptions;
};

/**
 * Container component which holds the navigation state designed for React Native apps.
 * This should be rendered at the root wrapping the whole app.
 *
 * @param props.onReady Callback which is called after the navigation tree mounts.
 * @param props.onStateChange Callback which is called with the latest navigation state when it changes.
 * @param props.onUnhandledAction Callback which is called when an action is not handled. TODO(@ubax): restore this callback. https://linear.app/expo/issue/ENG-26123
 * @param props.direction Text direction of the components. Defaults to `'ltr'`.
 * @param props.theme Theme object for the UI elements.
 * @param props.linking Options for deep linking.
 * @param props.fallback Fallback component to render until we have finished getting initial state. Defaults to `null`.
 * @param props.documentTitle Options to configure the document title on Web. Updating document title is handled by default unless `documentTitle.enabled` is `false`.
 * @param props.children Child elements to render the content.
 * @param props.ref Ref object which refers to the navigation object containing helper methods.
 */
function NavigationContainerInner({
  direction = I18nManager.getConstants().isRTL ? 'rtl' : 'ltr',
  theme = DefaultTheme,
  linking,
  fallback = null,
  documentTitle,
  ref,
  ...rest
}: Props<ParamListBase> & {
  ref?: React.Ref<NavigationContainerRef<ParamListBase> | null>;
}) {
  const routerConfig = React.use(RouterConfigContext);

  if (linking?.config) {
    validatePathConfig(linking.config);
  }

  const refContainer = React.useRef<NavigationContainerRef<ParamListBase> | null>(null);

  useBackButton(refContainer);
  useDocumentTitle(refContainer, documentTitle);

  const { getInitialState } = useLinking(refContainer, {
    prefixes: [],
    ...linking,
  });

  const linkingContext = React.useMemo(() => ({ options: linking }), [linking]);
  // Add additional linking related info to the ref
  // This will be used by the devtools
  React.useEffect(() => {
    if (refContainer.current) {
      REACT_NAVIGATION_DEVTOOLS.set(refContainer.current, {
        get linking() {
          return {
            ...linking,
            prefixes: linking?.prefixes ?? [],
            getStateFromPath: linking?.getStateFromPath ?? getStateFromPath,
            getPathFromState: linking?.getPathFromState ?? getPathFromState,
          };
        },
      });
    }
  });

  const [isResolved, initialState] = useThenable(getInitialState);
  React.useImperativeHandle(ref, () => refContainer.current!);

  if (!isResolved) {
    // This is temporary until we have Suspense for data-fetching
    // Then the fallback will be handled by a parent `Suspense` component
    return <ThemeProvider value={theme}>{fallback}</ThemeProvider>;
  }

  if (initialState === undefined) {
    throw new Error(
      'Linking did not produce an initial navigation state. Expo Router always seeds a complete initial state before rendering the navigation container, so this is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.'
    );
  }

  return (
    <LocaleDirContext.Provider value={direction}>
      <LinkingContext.Provider value={linkingContext}>
        <BaseNavigationContainer
          {...rest}
          theme={theme}
          initialState={initialState}
          UNSTABLE_routeNode={routerConfig?.routeNode ?? undefined}
          ref={refContainer}
        />
      </LinkingContext.Provider>
    </LocaleDirContext.Provider>
  );
}

// The implementation uses the base param list, while callers retain their concrete route types.
export const NavigationContainer = NavigationContainerInner as <
  RootParamList extends object = ReactNavigation.RootParamList,
>(
  props: Props<RootParamList> & {
    ref?: React.Ref<NavigationContainerRef<RootParamList>>;
  }
) => React.ReactElement;
