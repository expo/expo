'use client';

import { useNavigation, useRoute } from '@react-navigation/native';
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';

import { NativeTabsTriggerTabBar } from './NativeTabsTriggerTabBar';
import type {
  NativeTabOptions,
  NativeTabsTriggerTabBarProps,
  NativeTabTriggerProps,
} from './types';
import { filterAllowedChildrenElements, isChildOfType } from './utils';
import { useIsPreview } from '../link/preview/PreviewRouteContext';
import { useSafeLayoutEffect } from '../views/useSafeLayoutEffect';
import {
  Icon,
  Badge,
  Label,
  type LabelProps,
  type IconProps,
  type BadgeProps,
  type SourceIconCombination,
  VectorIcon,
  type VectorIconProps,
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
 *         <Label>Home</Label>
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
  TabBar: NativeTabsTriggerTabBar,
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
    Badge,
    Label,
    Icon,
    NativeTabsTriggerTabBar,
  ]);
  return allowedChildren.reduce<NativeTabOptions>(
    (acc, child) => {
      if (isChildOfType(child, Badge)) {
        appendBadgeOptions(acc, child.props);
      } else if (isChildOfType(child, Label)) {
        appendLabelOptions(acc, child.props);
      } else if (isChildOfType(child, Icon)) {
        appendIconOptions(acc, child.props);
      } else if (isChildOfType(child, NativeTabsTriggerTabBar)) {
        appendTabBarOptions(acc, child.props);
      }
      return acc;
    },
    { ...initialOptions }
  );
}

function appendBadgeOptions(options: NativeTabOptions, props: BadgeProps) {
  options.selectedBadgeBackgroundColor = props.selectedBackgroundColor;
  if (props.hidden) {
    options.badgeValue = undefined;
  } else if (props.children) {
    options.badgeValue = String(props.children);
  } else {
    // If no value is provided, we set it to a space to show the badge
    // Otherwise, the `react-native-screens` will interpret it as a hidden badge
    // https://github.com/software-mansion/react-native-screens/blob/b4358fd95dd0736fc54df6bb97f210dc89edf24c/ios/bottom-tabs/RNSBottomTabsScreenComponentView.mm#L172
    options.badgeValue = ' ';
  }
}

function appendLabelOptions(options: NativeTabOptions, props: LabelProps) {
  if ('selectedStyle' in props) {
    options.selectedLabelStyle = props.selectedStyle;
  }
  if (props.hidden) {
    options.title = '';
  } else if ('children' in props) {
    options.title = props.children;
  }
}

export function appendIconOptions(options: NativeTabOptions, props: IconProps) {
  if ('selectedColor' in props) {
    options.selectedIconColor = props.selectedColor;
  }
  if ('sf' in props || 'src' in props || 'androidSrc' in props || 'drawable' in props) {
    options.icon = undefined;
    options.selectedIcon = undefined;
  }

  if ('src' in props && props.src) {
    const icon = convertIconSrcToIconOption(props);
    options.icon = icon?.icon;
    options.selectedIcon = icon?.selectedIcon;
  } else if ('sf' in props && process.env.EXPO_OS === 'ios') {
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
  } else if ('androidSrc' in props && process.env.EXPO_OS === 'android') {
    const icon = convertIconSrcToIconOption({ src: props.androidSrc });
    options.icon = icon?.icon;
    options.selectedIcon = icon?.selectedIcon;
  } else if ('drawable' in props && process.env.EXPO_OS === 'android') {
    options.icon = { drawable: props.drawable };
    options.selectedIcon = undefined;
  }
}

function convertIconSrcToIconOption(
  icon: SourceIconCombination | undefined
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
      if (src.type === VectorIcon) {
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

function appendTabBarOptions(options: NativeTabOptions, props: NativeTabsTriggerTabBarProps) {
  const {
    backgroundColor,
    blurEffect,
    iconColor,
    disableTransparentOnScrollEdge,
    badgeBackgroundColor,
    badgeTextColor,
    indicatorColor,
    labelStyle,
    shadowColor,
  } = props;

  if (backgroundColor) {
    options.backgroundColor = backgroundColor;
  }
  // We need better native integration of this on Android
  // Simulating from JS side creates ugly transitions
  if (process.env.EXPO_OS !== 'android') {
    if (blurEffect) {
      options.blurEffect = blurEffect;
    }
    if (shadowColor) {
      options.shadowColor = shadowColor;
    }
    if (iconColor) {
      options.iconColor = iconColor;
    }
    if (disableTransparentOnScrollEdge !== undefined) {
      options.disableTransparentOnScrollEdge = disableTransparentOnScrollEdge;
    }
    if (badgeBackgroundColor) {
      options.badgeBackgroundColor = badgeBackgroundColor;
    }
    if (badgeTextColor) {
      options.badgeTextColor = badgeTextColor;
    }
    if (indicatorColor) {
      options.indicatorColor = indicatorColor;
    }
    if (labelStyle) {
      options.labelStyle = labelStyle;
    }
  }
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
