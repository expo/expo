'use client';

import { useNavigation, useRoute } from '@react-navigation/native';
import { isValidElement, type ReactElement, type ReactNode } from 'react';

import type { ExtendedNativeTabOptions, NativeTabTriggerProps } from './types';
import { filterAllowedChildrenElements, isChildOfType } from './utils';
import { useSafeLayoutEffect } from '../../views/useSafeLayoutEffect';
import { Icon, Badge, Label } from '../common/elements';

/**
 * The component used to customize the native tab options both in the _layout file and from the tab screen.
 *
 * When used in the _layout file, you need to provide a `name` prop.
 * When used in the tab screen, the `name` prop takes no effect.
 *
 * @example
 * ```tsx
 * // In _layout file
 * import { NativeTabs } from 'expo-router/unstable-native-tabs';
 *
 * export default function Layout() {
 *   return (
 *     <NativeTabs>
 *       <NativeTabs.Trigger name="home" />
 *       <NativeTabs.Trigger name="settings" />
 *     </NativeTabs>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // In a tab screen
 * import { NativeTabs } from 'expo-router/unstable-native-tabs';
 *
 * export default function HomeScreen() {
 *   return (
 *     <View>
 *       <NativeTabs.Trigger>
 *         <Label>Home</Label>
 *       </NativeTabs.Trigger>
 *       <Text>This is home screen!</Text>
 *     </View>
 *   );
 * }
 *
 * **Note:** You can use the alias `NativeTabs.Trigger` for this component.
 */
export function NativeTabTrigger(props: NativeTabTriggerProps) {
  const route = useRoute();
  const navigation = useNavigation();
  const isFocused = navigation.isFocused();

  useSafeLayoutEffect(() => {
    // This will cause the tab to update only when it is focused.
    // As long as all tabs are loaded at the start, we don't need this check.
    // It is here to ensure similar behavior to stack
    if (isFocused) {
      if (navigation.getState()?.type !== 'tab') {
        throw new Error(
          `Trigger component can only be used in the tab screen. Current route: ${route.name}`
        );
      }
      const options = convertTabPropsToOptions(props);
      navigation.setOptions(options);
    }
  }, [isFocused, props]);

  return null;
}

export function convertTabPropsToOptions({
  options,
  hidden,
  children,
  disablePopToTop,
  disableScrollToTop,
}: NativeTabTriggerProps) {
  const initialOptions: ExtendedNativeTabOptions = {
    ...options,
    hidden: !!hidden,
    specialEffects: {
      repeatedTabSelection: {
        popToRoot: !disablePopToTop,
        scrollToTop: !disableScrollToTop,
      },
    },
  };
  const allowedChildren = filterAllowedChildrenElements(children, [Badge, Label, Icon]);
  return allowedChildren.reduce<ExtendedNativeTabOptions>(
    (acc, child) => {
      if (isChildOfType(child, Badge)) {
        if (child.props.children) {
          acc.badgeValue = String(child.props.children);
        } else if (!child.props.hidden) {
          // If no value is provided, we set it to a space to show the badge
          // Otherwise, the `react-native-screens` will interpret it as a hidden badge
          // https://github.com/software-mansion/react-native-screens/blob/b4358fd95dd0736fc54df6bb97f210dc89edf24c/ios/bottom-tabs/RNSBottomTabsScreenComponentView.mm#L172
          acc.badgeValue = ' ';
        }
      } else if (isChildOfType(child, Label)) {
        if (child.props.hidden) {
          acc.title = '';
        } else {
          acc.title = child.props.children;
        }
      } else if (isChildOfType(child, Icon)) {
        if ('src' in child.props || 'selectedSrc' in child.props) {
          acc.icon = child.props.src
            ? {
                src: child.props.src,
              }
            : undefined;
          acc.selectedIcon = child.props.selectedSrc
            ? {
                src: child.props.selectedSrc,
              }
            : undefined;
        } else if ('sf' in child.props || 'selectedSf' in child.props) {
          if (process.env.EXPO_OS === 'ios') {
            acc.icon = child.props.sf
              ? {
                  sf: child.props.sf,
                }
              : undefined;
            acc.selectedIcon = child.props.selectedSf
              ? {
                  sf: child.props.selectedSf,
                }
              : undefined;
          }
        }
        if (process.env.EXPO_OS === 'android') {
          acc.icon = { drawable: child.props.drawable };
          acc.selectedIcon = undefined;
        }
      }
      return acc;
    },
    { ...initialOptions }
  );
}

export function isNativeTabTrigger(
  child: ReactNode,
  contextKey?: string
): child is ReactElement<NativeTabTriggerProps & { name: string }> {
  if (isValidElement(child) && child && child.type === NativeTabTrigger) {
    if (
      typeof child.props === 'object' &&
      child.props &&
      'name' in child.props &&
      !child.props.name
    ) {
      throw new Error(
        `<Trigger /> component in \`default export\` at \`app${contextKey}/_layout\` must have a \`name\` prop when used as a child of a Layout Route.`
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      if (
        ['component', 'getComponent'].some(
          (key) => child.props && typeof child.props === 'object' && key in child.props
        )
      ) {
        throw new Error(
          `<Trigger /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`component\` or \`getComponent\` prop when used as a child of a Layout Route`
        );
      }
    }

    return true;
  }

  return false;
}
