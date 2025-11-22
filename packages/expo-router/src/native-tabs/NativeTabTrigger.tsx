'use client';

import { useNavigation, useRoute } from '@react-navigation/native';
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, type ImageSourcePropType } from 'react-native';

import type { NativeTabOptions, NativeTabTriggerProps } from './types';
import { filterAllowedChildrenElements, isChildOfType } from './utils';
import { useIsPreview } from '../link/preview/PreviewRouteContext';
import type { VectorIconProps } from '../primitives';
import { useSafeLayoutEffect } from '../views/useSafeLayoutEffect';
import {
  NativeTabsTriggerIcon,
  NativeTabsTriggerBadge,
  NativeTabsTriggerLabel,
  NativeTabsTriggerVectorIcon,
  type NativeTabsTriggerBadgeProps,
  type NativeTabsTriggerLabelProps,
  type NativeTabsTriggerIconProps,
  type SrcIcon,
} from './common/elements';

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
 *         <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
 *       </NativeTabs.Trigger>
 *       <Text>This is home screen!</Text>
 *     </View>
 *   );
 * }
 * ```
 *
 * > **Note:** You can use the alias `NativeTabs.Trigger` for this component.
 */
function NativeTabTriggerImpl(props: NativeTabTriggerProps) {
  const route = useRoute();
  const navigation = useNavigation();
  const isFocused = navigation.isFocused();
  const isInPreview = useIsPreview();

  useSafeLayoutEffect(() => {
    // This will cause the tab to update only when it is focused.
    // As long as all tabs are loaded at the start, we don't need this check.
    // It is here to ensure similar behavior to stack
    if (isFocused && !isInPreview) {
      if (navigation.getState()?.type !== 'tab') {
        throw new Error(
          `Trigger component can only be used in the tab screen. Current route: ${route.name}`
        );
      }
      const options = convertTabPropsToOptions(props, true);
      navigation.setOptions(options);
    }
  }, [isFocused, props, isInPreview]);

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
  }: NativeTabTriggerProps,
  isDynamic: boolean = false
) {
  const initialOptions: NativeTabOptions = isDynamic
    ? {
        ...(unstable_nativeProps ? { nativeProps: unstable_nativeProps } : {}),
      }
    : {
        hidden: !!hidden,
        specialEffects: {
          repeatedTabSelection: {
            popToRoot: !disablePopToTop,
            scrollToTop: !disableScrollToTop,
          },
        },
        role,
        nativeProps: unstable_nativeProps,
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

export function appendIconOptions(options: NativeTabOptions, props: NativeTabsTriggerIconProps) {
  if ('sf' in props && props.sf && process.env.EXPO_OS === 'ios') {
    if (typeof props.sf === 'string') {
      options.icon = props.sf
        ? {
            sf: props.sf,
          }
        : undefined;
      options.selectedIcon = undefined;
    } else if (props.sf) {
      options.icon = props.sf.default
        ? {
            sf: props.sf.default,
          }
        : undefined;
      options.selectedIcon = props.sf.selected
        ? {
            sf: props.sf.selected,
          }
        : undefined;
    }
  } else if ('drawable' in props && props.drawable && process.env.EXPO_OS === 'android') {
    options.icon = { drawable: props.drawable };
    options.selectedIcon = undefined;
  } else if ('src' in props && props.src) {
    const icon = convertIconSrcToIconOption(props);
    options.icon = icon?.icon;
    options.selectedIcon = icon?.selectedIcon;
  }
  if (props.selectedColor) {
    options.selectedIconColor = props.selectedColor;
  }
}

function convertIconSrcToIconOption(
  icon: SrcIcon | undefined
): Pick<NativeTabOptions, 'icon' | 'selectedIcon'> | undefined {
  if (icon && icon.src) {
    const { defaultIcon, selected } =
      typeof icon.src === 'object' && 'selected' in icon.src
        ? { defaultIcon: icon.src.default, selected: icon.src.selected }
        : { defaultIcon: icon.src };

    const options: Pick<NativeTabOptions, 'icon' | 'selectedIcon'> = {};
    options.icon = convertSrcOrComponentToSrc(defaultIcon);
    options.selectedIcon = convertSrcOrComponentToSrc(selected);
    return options;
  }

  return undefined;
}

function convertSrcOrComponentToSrc(src: ImageSourcePropType | ReactElement | undefined) {
  if (src) {
    if (isValidElement(src)) {
      if (src.type === NativeTabsTriggerVectorIcon) {
        const props = src.props as VectorIconProps<string>;
        return { src: props.family.getImageSource(props.name, 24, 'white') };
      } else {
        console.warn('Only VectorIcon is supported as a React element in Icon.src');
      }
    } else {
      return { src };
    }
  }
  return undefined;
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
