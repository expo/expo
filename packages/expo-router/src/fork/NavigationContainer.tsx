import React from 'react';
import { I18nManager } from 'react-native';

import { getRouteInfoFromState } from '../global-state/getRouteInfoFromState';
import { useFlushPreReadyActions } from '../imperative-api';
import type {
  DocumentTitleOptions,
  LinkingOptions,
  LocaleDirection,
  NavigationContainerProps,
  NavigationContainerRef,
  NavigationState,
  ParamListBase,
} from '../react-navigation/native';
import {
  BaseNavigationContainer,
  DefaultTheme,
  LinkingContext,
  LocaleDirContext,
  UNSTABLE_UnhandledLinkingContext as UnhandledLinkingContext,
  getActionFromState,
  getPathFromState,
  getStateFromPath,
  validatePathConfig,
} from '../react-navigation/native';
import useLatestCallback from '../utils/useLatestCallback';
import { extractExpoPathFromURL } from './extractPathFromURL';
import { useBackButton } from './useBackButton';
import { useDocumentTitle } from './useDocumentTitle';
import { useLinking } from './useLinking';

declare global {
  // eslint-disable-next-line no-var
  var REACT_NAVIGATION_DEVTOOLS: WeakMap<
    NavigationContainerRef<any>,
    { readonly linking: LinkingOptions<any> }
  >;
}

globalThis.REACT_NAVIGATION_DEVTOOLS = new WeakMap();

type Props<ParamList extends object> = NavigationContainerProps & {
  direction?: LocaleDirection;
  linking?: LinkingOptions<ParamList>;
  documentTitle?: DocumentTitleOptions;
};

/**
 * Container component which holds the navigation state designed for React Native apps.
 * This should be rendered at the root wrapping the whole app.
 *
 * @param props.initialState Seed for the navigation tree, used verbatim (never staled). Internal/standalone-test seam only — the expo-router app path (`ExpoRoot`) must never pass it, because the store has already compiled the initial URL into the seed (see the persistence TODO in `BaseNavigationContainer`).
 * @param props.onReady Callback which is called after the navigation tree mounts.
 * @param props.onStateChange Callback which is called with the latest navigation state when it changes.
 * @param props.direction Text direction of the components. Defaults to `'ltr'`.
 * @param props.theme Theme object for the UI elements.
 * @param props.linking Options for deep linking. Deep link handling is enabled when this prop is provided, unless `linking.enabled` is `false`.
 * @param props.documentTitle Options to configure the document title on Web. Updating document title is handled by default unless `documentTitle.enabled` is `false`.
 * @param props.children Child elements to render the content.
 * @param props.ref Ref object which refers to the navigation object containing helper methods.
 */
function NavigationContainerInner(
  {
    direction = I18nManager.getConstants().isRTL ? 'rtl' : 'ltr',
    theme = DefaultTheme,
    linking,
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

  const refContainer = React.useRef<NavigationContainerRef<ParamListBase> | null>(null);

  useBackButton(refContainer);
  useDocumentTitle(refContainer, documentTitle);
  useFlushPreReadyActions();

  const [lastUnhandledLink, setLastUnhandledLink] = React.useState<string | undefined>();

  // The store already compiled the initial URL into the seed, so we no longer consume
  // `getInitialState` for the initial container state. We still call `useLinking` for its
  // history-event path (browser back/forward and native deep-link listeners), which dispatches
  // complete keyed state via `resetRoot`/actions without re-staling.
  useLinking(
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

  // Clear `lastUnhandledLink` once the committed state actually reaches it. The current URL is
  // derived from the committed state (`getRouteInfoFromState`) rather than read off a route's
  // stashed `path`; both the derived URL and the tracked link are normalized to the same shape
  // (`extractExpoPathFromURL`) before comparing. The derivation runs only when a link is actually
  // being tracked — the tracked link only comes from expo-router's linking (a complete `__root`
  // tree), so `getRouteInfoFromState` never sees a non-expo-router shape here.
  const clearHandledLink = useLatestCallback(() => {
    setLastUnhandledLink((previousLastUnhandledLink) => {
      if (previousLastUnhandledLink == null) {
        return previousLastUnhandledLink;
      }

      const state = refContainer.current?.getRootState();
      const currentPath =
        state != null
          ? extractExpoPathFromURL([], getRouteInfoFromState(state).pathnameWithParams)
          : undefined;

      if (extractExpoPathFromURL([], previousLastUnhandledLink) === currentPath) {
        return undefined;
      }
      return previousLastUnhandledLink;
    });
  });

  const onReadyForLinkingHandling = useLatestCallback(() => {
    clearHandledLink();
    onReady?.();
  });

  const onStateChangeForLinkingHandling = useLatestCallback(
    (state: Readonly<NavigationState> | undefined) => {
      clearHandledLink();
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
            getActionFromState: linking?.getActionFromState ?? getActionFromState,
          };
        },
      });
    }
  });

  React.useImperativeHandle(ref, () => refContainer.current!);

  return (
    <LocaleDirContext.Provider value={direction}>
      <UnhandledLinkingContext.Provider value={unhandledLinkingContext}>
        <LinkingContext.Provider value={linkingContext}>
          <BaseNavigationContainer
            {...rest}
            theme={theme}
            onReady={onReadyForLinkingHandling}
            onStateChange={onStateChangeForLinkingHandling}
            ref={refContainer}
          />
        </LinkingContext.Provider>
      </UnhandledLinkingContext.Provider>
    </LocaleDirContext.Provider>
  );
}

export const NavigationContainer = React.forwardRef(NavigationContainerInner) as <
  RootParamList extends object = ReactNavigation.RootParamList,
>(
  props: Props<RootParamList> & {
    ref?: React.Ref<NavigationContainerRef<RootParamList>>;
  }
) => React.ReactElement;
