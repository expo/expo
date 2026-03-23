import {
  BaseNavigationContainer,
  getActionFromState,
  getPathFromState,
  getStateFromPath,
  type NavigationContainerProps,
  type NavigationContainerRef,
  type NavigationState,
  type ParamListBase,
  ThemeProvider,
  validatePathConfig,
} from '@react-navigation/core';
import * as React from 'react';
import { I18nManager } from 'react-native';
import useLatestCallback from 'use-latest-callback';

import { LinkingContext } from './LinkingContext';
import { LocaleDirContext } from './LocaleDirContext';
import { DefaultTheme } from './theming/DefaultTheme';
import type {
  DocumentTitleOptions,
  LinkingOptions,
  LocaleDirection,
} from './types';
import { UnhandledLinkingContext } from './UnhandledLinkingContext';
import { useBackButton } from './useBackButton';
import { useDocumentTitle } from './useDocumentTitle';
import { useLinking } from './useLinking';
import { useThenable } from './useThenable';

declare global {
  var REACT_NAVIGATION_DEVTOOLS: WeakMap<
    NavigationContainerRef<any>,
    { readonly linking: LinkingOptions<any> }
  >;
}

globalThis.REACT_NAVIGATION_DEVTOOLS = new WeakMap();

type Props<ParamList extends {}> = NavigationContainerProps & {
  /**
   * Initial state object for the navigation tree.
   *
   * If this is provided, deep link or URLs won't be handled on the initial render.
   */
  initialState?: NavigationContainerProps['initialState'];
  /**
   * Text direction of the components. Defaults to `'ltr'`.
   */
  direction?: LocaleDirection;
  /**
   * Options for deep linking.
   *
   * Deep link handling is enabled when this prop is provided,
   * unless `linking.enabled` is `false`.
   */
  linking?: LinkingOptions<ParamList>;
  /**
   * Fallback element to render until initial state is resolved from deep linking.
   *
   * Defaults to `null`.
   */
  fallback?: React.ReactNode;
  /**
   * Options to configure the document title on Web.
   *
   * Updating document title is handled by default,
   * unless `documentTitle.enabled` is `false`.
   */
  documentTitle?: DocumentTitleOptions;
};

function NavigationContainerInner(
  {
    direction = I18nManager.getConstants().isRTL ? 'rtl' : 'ltr',
    theme = DefaultTheme,
    linking,
    fallback = null,
    documentTitle,
    onReady,
    onStateChange,
    ...rest
  }: Props<ParamListBase>,
  ref?: React.Ref<NavigationContainerRef<ParamListBase> | null>
) {
  const isLinkingEnabled = linking ? linking.enabled !== false : false;

  if (linking?.config) {
    validatePathConfig(linking.config);
  }

  const refContainer =
    React.useRef<NavigationContainerRef<ParamListBase>>(null);

  useBackButton(refContainer);
  useDocumentTitle(refContainer, documentTitle);

  const [lastUnhandledLink, setLastUnhandledLink] = React.useState<
    string | undefined
  >();

  const { getInitialState } = useLinking(
    refContainer,
    {
      enabled: isLinkingEnabled,
      prefixes: [],
      ...linking,
    },
    setLastUnhandledLink
  );

  const linkingContext = React.useMemo(() => ({ options: linking }), [linking]);

  const unhandledLinkingContext = React.useMemo(
    () => ({ lastUnhandledLink, setLastUnhandledLink }),
    [lastUnhandledLink, setLastUnhandledLink]
  );

  const onReadyForLinkingHandling = useLatestCallback(() => {
    // If the screen path matches lastUnhandledLink, we do not track it
    const path = refContainer.current?.getCurrentRoute()?.path;
    setLastUnhandledLink((previousLastUnhandledLink) => {
      if (previousLastUnhandledLink === path) {
        return undefined;
      }
      return previousLastUnhandledLink;
    });
    onReady?.();
  });

  const onStateChangeForLinkingHandling = useLatestCallback(
    (state: Readonly<NavigationState> | undefined) => {
      // If the screen path matches lastUnhandledLink, we do not track it
      const path = refContainer.current?.getCurrentRoute()?.path;
      setLastUnhandledLink((previousLastUnhandledLink) => {
        if (previousLastUnhandledLink === path) {
          return undefined;
        }
        return previousLastUnhandledLink;
      });
      onStateChange?.(state);
    }
  );
  // Add additional linking related info to the ref
  // This will be used by the devtools
  React.useEffect(() => {
    if (refContainer.current) {
      REACT_NAVIGATION_DEVTOOLS.set(refContainer.current, {
        get linking() {
          return {
            ...linking,
            enabled: isLinkingEnabled,
            prefixes: linking?.prefixes ?? [],
            getStateFromPath: linking?.getStateFromPath ?? getStateFromPath,
            getPathFromState: linking?.getPathFromState ?? getPathFromState,
            getActionFromState:
              linking?.getActionFromState ?? getActionFromState,
          };
        },
      });
    }
  });

  const [isResolved, initialState] = useThenable(getInitialState);

  // FIXME
  // @ts-expect-error not sure why this is not working
  React.useImperativeHandle(ref, () => refContainer.current);

  const isLinkingReady =
    rest.initialState != null || !isLinkingEnabled || isResolved;

  if (!isLinkingReady) {
    return (
      <LocaleDirContext.Provider value={direction}>
        <ThemeProvider value={theme}>{fallback}</ThemeProvider>
      </LocaleDirContext.Provider>
    );
  }

  return (
    <LocaleDirContext.Provider value={direction}>
      <UnhandledLinkingContext.Provider value={unhandledLinkingContext}>
        <LinkingContext.Provider value={linkingContext}>
          <BaseNavigationContainer
            {...rest}
            theme={theme}
            onReady={onReadyForLinkingHandling}
            onStateChange={onStateChangeForLinkingHandling}
            initialState={
              rest.initialState == null ? initialState : rest.initialState
            }
            ref={refContainer}
          />
        </LinkingContext.Provider>
      </UnhandledLinkingContext.Provider>
    </LocaleDirContext.Provider>
  );
}

/**
 * Container component that manages the navigation state.
 * This should be rendered at the root wrapping the whole app.
 */
export const NavigationContainer = React.forwardRef(
  NavigationContainerInner
) as <RootParamList extends {} = ReactNavigation.RootParamList>(
  props: Props<RootParamList> & {
    ref?: React.Ref<NavigationContainerRef<RootParamList>>;
  }
) => React.ReactElement;
