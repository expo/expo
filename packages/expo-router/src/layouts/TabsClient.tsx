'use client';

import type { ComponentProps } from 'react';
import { Pressable, Platform } from 'react-native';

import { getNavigateAction } from '../global-state/getNavigationAction';
import { Link } from '../link/Link';
import type {
  BottomTabNavigationEventMap,
  BottomTabNavigationOptions,
} from '../react-navigation/bottom-tabs';
import { createBottomTabNavigator } from '../react-navigation/bottom-tabs';
import type { ParamListBase, TabNavigationState } from '../react-navigation/native';
import type { Href } from '../types';
import { Protected } from '../views/Protected';
import { getRouteNodeHrefMap } from '../views/useSitemap';
import { withLayoutContext } from './withLayoutContext';

// This is the only way to access the navigator.
const BottomTabNavigator = createBottomTabNavigator().Navigator;

export type BottomTabNavigator = typeof BottomTabNavigator;

type TabsProps = BottomTabNavigationOptions & { href?: Href | null };

const ExpoTabs = withLayoutContext<
  TabsProps,
  typeof BottomTabNavigator,
  TabNavigationState<ParamListBase>,
  BottomTabNavigationEventMap
>(BottomTabNavigator, (screens, node) => {
  const hrefMap = node ? getRouteNodeHrefMap() : undefined;

  return screens.map((screen) => {
    if (typeof screen.options === 'function') {
      return screen;
    }

    // Explicit `href`: keep the existing shortcut — render the tab button as a `<Link>` (real web
    // anchors) and hide the tab when `href` is null.
    if (screen.options?.href !== undefined) {
      const { href, ...options } = screen.options;
      if (options.tabBarButton) {
        throw new Error('Cannot use `href` and `tabBarButton` together.');
      }
      return {
        ...screen,
        options: {
          ...options,
          href,
          tabBarItemStyle: href == null ? { display: 'none' } : options.tabBarItemStyle,
          // @ts-expect-error: TODO(@kitten): This isn't properly typed
          tabBarButton: (props) => {
            if (href == null) {
              return null;
            }
            const children =
              Platform.OS === 'web' ? props.children : <Pressable>{props.children}</Pressable>;
            // TODO: React Navigation types these props as Animated.WithAnimatedValue<StyleProp<ViewStyle>>
            //       While Link expects a TextStyle. We need to reconcile these types.
            return (
              <Link
                {...(props as any)}
                style={[{ display: 'flex' }, props.style as any]}
                href={href}
                asChild={Platform.OS !== 'web'}
                children={children}
              />
            );
          },
        },
      };
    }

    // File-based tab with no explicit href: keep the default tab button (so it still emits
    // `tabPress` and re-tap pops the nested stack to root) but hand it an action builder derived from
    // the filesystem route. On the first press `BottomTabBar` dispatches this to establish the tab's
    // complete compiled subtree (its base/anchor); a re-visit keeps the previous state, since the
    // store install is a no-op once the tab slice exists.
    if (hrefMap != null && node != null) {
      const child = node.children.find((c) => c.route === screen.name);
      const derivedHref = child ? hrefMap.get(child.contextKey) : undefined;

      if (derivedHref != null) {
        return {
          ...screen,
          options: {
            ...screen.options,
            unstable_tabBarNavigateAction: () => getNavigateAction(derivedHref, {}),
          },
        };
      }
    }

    return screen;
  });
});

/**
 * Renders a tabs navigator.
 *
 * @hideType
 */
const Tabs = Object.assign(
  (props: ComponentProps<typeof ExpoTabs>) => {
    return <ExpoTabs {...props} />;
  },
  {
    Screen: ExpoTabs.Screen,
    Protected,
  }
);

export default Tabs;
