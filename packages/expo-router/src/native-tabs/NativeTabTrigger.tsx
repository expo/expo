'use client';

import { useCallback, type ReactElement, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { useNavigation, useRoute } from '../react-navigation/native';
import {
  NativeTabsTriggerIcon,
  NativeTabsTriggerBadge,
  NativeTabsTriggerLabel,
  NativeTabsTriggerVectorIcon,
  type NativeTabsTriggerBadgeProps,
  type NativeTabsTriggerLabelProps,
} from './common/elements';
import type { NativeTabOptions, NativeTabTriggerProps } from './types';
import { appendIconOptions } from './utils/optionsIconConverter';
import { useIsPreview } from '../link/preview/PreviewRouteContext';
import { useFocusEffect } from '../useFocusEffect';
import { filterAllowedChildrenElements, isChildOfType } from '../utils/children';

/**
 * The component used to customize the native tab options both in the _layout file and from the tab screen.
 *
 * When used in the _layout file, you need to provide a `name` prop.
 * When used in the tab screen, the `name` prop takes no effect.
 *
 * @example
 * ```tsx app/_layout.tsx
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
 * ```tsx app/home.tsx
 * import { NativeTabs } from 'expo-router/unstable-native-tabs';
 *
 * export default function HomeScreen() {
 *   return (
 *     <View>
 *       <NativeTabs.Trigger>
 *         <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
 *       </NativeTabs.Trigger>
 *       <Text>This is home screen!</Text>
 *     </View>
 *   );
 * }
 * ```
 */
function NativeTabTriggerImpl(props: NativeTabTriggerProps) {
  const route = useRoute();
  const navigation = useNavigation();
  const isInPreview = useIsPreview();

  useFocusEffect(
    useCallback(() => {
      // This will cause the tab to update only when it is focused.
      // As long as all tabs are loaded at the start, we don't need this check.
      // It is here to ensure similar behavior to stack
      if (!isInPreview) {
        if (navigation.getState()?.type !== 'tab') {
          throw new Error(
            `Trigger component can only be used in the tab screen. Current route: ${route.name}`
          );
        }
        const options = convertTabPropsToOptions(props, true);
        navigation.setOptions(options);
      }
    }, [props, isInPreview])
  );

  return null;
}

export const NativeTabTrigger = Object.assign(NativeTabTriggerImpl, {
  Label: NativeTabsTriggerLabel,
  Icon: NativeTabsTriggerIcon,
  Badge: NativeTabsTriggerBadge,
  VectorIcon: NativeTabsTriggerVectorIcon,
});

export function convertTabPropsToOptions(
  {
    hidden,
    children,
    role,
    disablePopToTop,
    disableScrollToTop,
    unstable_nativeProps,
    disableAutomaticContentInsets,
    contentStyle,
    disableTransparentOnScrollEdge,
    disabled,
  }: NativeTabTriggerProps,
  isDynamic: boolean = false
) {
  const initialOptions: NativeTabOptions = isDynamic
    ? {
        ...(unstable_nativeProps ? { nativeProps: unstable_nativeProps } : {}),
        ...(disableTransparentOnScrollEdge !== undefined ? { disableTransparentOnScrollEdge } : {}),
        ...(disabled !== undefined ? { disabled } : {}),
      }
    : {
        hidden: !!hidden,
        specialEffects: {
          repeatedTabSelection: {
            popToRoot: !disablePopToTop,
            scrollToTop: !disableScrollToTop,
          },
        },
        contentStyle,
        role,
        nativeProps: unstable_nativeProps,
        disableAutomaticContentInsets,
        ...(disableTransparentOnScrollEdge !== undefined ? { disableTransparentOnScrollEdge } : {}),
        ...(disabled !== undefined ? { disabled } : {}),
      };
  const allowedChildren = filterAllowedChildrenElements(children, [
    NativeTabsTriggerBadge,
    NativeTabsTriggerLabel,
    NativeTabsTriggerIcon,
  ]);
  return allowedChildren.reduce<NativeTabOptions>(
    (acc, child) => {
      if (isChildOfType(child, NativeTabsTriggerBadge)) {
        appendBadgeOptions(acc, child.props);
      } else if (isChildOfType(child, NativeTabsTriggerLabel)) {
        appendLabelOptions(acc, child.props);
      } else if (isChildOfType(child, NativeTabsTriggerIcon)) {
        appendIconOptions(acc, child.props);
      }
      return acc;
    },
    { ...initialOptions }
  );
}

function appendBadgeOptions(options: NativeTabOptions, props: NativeTabsTriggerBadgeProps) {
  if (props.children) {
    options.badgeValue = String(props.children);
    options.selectedBadgeBackgroundColor = props.selectedBackgroundColor;
  } else if (!props.hidden) {
    // If no value is provided, we set it to a space to show the badge
    // Otherwise, the `react-native-screens` will interpret it as a hidden badge
    // https://github.com/software-mansion/react-native-screens/blob/b4358fd95dd0736fc54df6bb97f210dc89edf24c/ios/bottom-tabs/RNSBottomTabsScreenComponentView.mm#L172
    options.badgeValue = ' ';
  }
}

function appendLabelOptions(options: NativeTabOptions, props: NativeTabsTriggerLabelProps) {
  if (props.hidden) {
    options.title = '';
  } else {
    options.title = props.children;
    if (props.selectedStyle) {
      options.selectedLabelStyle = StyleSheet.flatten(props.selectedStyle);
    }
  }
}

export function isNativeTabTrigger(
  child: ReactNode,
  contextKey?: string
): child is ReactElement<NativeTabTriggerProps & { name: string }> {
  if (isChildOfType(child, NativeTabTrigger)) {
    if ('name' in child.props && !child.props.name) {
      throw new Error(
        `<Trigger /> component in \`default export\` at \`app${contextKey}/_layout\` must have a \`name\` prop when used as a child of a Layout Route.`
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      if ((['component', 'getComponent'] as const).some((key) => key in child.props)) {
        throw new Error(
          `<Trigger /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`component\` or \`getComponent\` prop when used as a child of a Layout Route`
        );
      }
    }

    return true;
  }

  return false;
}
