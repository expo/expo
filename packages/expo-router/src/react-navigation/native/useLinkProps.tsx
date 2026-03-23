import {
  getPathFromState,
  type NavigationAction,
  NavigationContainerRefContext,
  NavigationHelpersContext,
  type NavigatorScreenParams,
  type ParamListBase,
} from '@react-navigation/core';
import type { NavigationState, PartialState } from '@react-navigation/routers';
import * as React from 'react';
import { type GestureResponderEvent, Platform } from 'react-native';

import { LinkingContext } from './LinkingContext';

export type LinkProps<
  ParamList extends ReactNavigation.RootParamList,
  RouteName extends keyof ParamList = keyof ParamList,
> =
  | ({
      href?: string;
      action?: NavigationAction;
    } & (RouteName extends unknown
      ? undefined extends ParamList[RouteName]
        ? { screen: RouteName; params?: ParamList[RouteName] }
        : { screen: RouteName; params: ParamList[RouteName] }
      : never))
  | {
      href?: string;
      action: NavigationAction;
      screen?: undefined;
      params?: undefined;
    };

const getStateFromParams = (
  params: NavigatorScreenParams<ParamListBase> | undefined
): PartialState<NavigationState> | NavigationState | undefined => {
  if (params?.state) {
    return params.state;
  }

  if (params?.screen) {
    return {
      routes: [
        {
          name: params.screen,
          params: params.params,
          // @ts-expect-error this is fine 🔥
          state: params.screen
            ? getStateFromParams(
                params.params as
                  | NavigatorScreenParams<ParamListBase>
                  | undefined
              )
            : undefined,
        },
      ],
    };
  }

  return undefined;
};

/**
 * Hook to get props for an anchor tag so it can work with in page navigation.
 *
 * @param props.screen Name of the screen to navigate to (e.g. `'Feeds'`).
 * @param props.params Params to pass to the screen to navigate to (e.g. `{ sort: 'hot' }`).
 * @param props.href Optional absolute path to use for the href (e.g. `/feeds/hot`).
 * @param props.action Optional action to use for in-page navigation. By default, the path is parsed to an action based on linking config.
 */
export function useLinkProps<ParamList extends ReactNavigation.RootParamList>({
  screen,
  params,
  href,
  action,
}: LinkProps<ParamList>) {
  const root = React.useContext(NavigationContainerRefContext);
  const navigation = React.useContext(NavigationHelpersContext);
  const { options } = React.useContext(LinkingContext);

  const onPress = (
    e?: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent
  ) => {
    let shouldHandle = false;

    if (Platform.OS !== 'web' || !e) {
      e?.preventDefault?.();
      shouldHandle = true;
    } else {
      // ignore clicks with modifier keys
      const hasModifierKey =
        ('metaKey' in e && e.metaKey) ||
        ('altKey' in e && e.altKey) ||
        ('ctrlKey' in e && e.ctrlKey) ||
        ('shiftKey' in e && e.shiftKey);

      // only handle left clicks
      const isLeftClick =
        'button' in e ? e.button == null || e.button === 0 : true;

      // let browser handle "target=_blank" etc.
      const isSelfTarget =
        e.currentTarget && 'target' in e.currentTarget
          ? [undefined, null, '', 'self'].includes(e.currentTarget.target)
          : true;

      if (!hasModifierKey && isLeftClick && isSelfTarget) {
        e.preventDefault?.();
        shouldHandle = true;
      }
    }

    if (shouldHandle) {
      if (action) {
        if (navigation) {
          navigation.dispatch(action);
        } else if (root) {
          root.dispatch(action);
        } else {
          throw new Error(
            "Couldn't find a navigation object. Is your component inside NavigationContainer?"
          );
        }
      } else {
        // @ts-expect-error This is already type-checked by the prop types
        navigation?.navigate(screen, params);
      }
    }
  };

  const getPathFromStateHelper = options?.getPathFromState ?? getPathFromState;

  return {
    href:
      href ??
      (Platform.OS === 'web' && screen != null
        ? getPathFromStateHelper(
            {
              routes: [
                {
                  // @ts-expect-error this is fine 🔥
                  name: screen,
                  // @ts-expect-error this is fine 🔥
                  params: params,
                  // @ts-expect-error this is fine 🔥
                  state: getStateFromParams(params),
                },
              ],
            },
            options?.config
          )
        : undefined),
    role: 'link' as const,
    onPress,
  };
}
