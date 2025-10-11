import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { ColorValue, ImageSourcePropType } from 'react-native';
import {
  BottomTabs,
  BottomTabsScreen,
  featureFlags,
  type BottomTabsProps,
  type BottomTabsScreenAppearance,
  type BottomTabsScreenProps,
} from 'react-native-screens';
import type { SFSymbol } from 'sf-symbols-typescript';

import {
  appendSelectedStyleToAppearance,
  convertStyleToAppearance,
  createScrollEdgeAppearanceFromOptions,
  createStandardAppearanceFromOptions,
} from './appearance';
import {
  SUPPORTED_BLUR_EFFECTS,
  SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES,
  SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS,
  type NativeTabOptions,
  type NativeTabsViewProps,
} from './types';
import { shouldTabBeVisible } from './utils';

// We let native tabs to control the changes. This requires freeze to be disabled for tab bar.
// Otherwise user may see glitches when switching between tabs.
featureFlags.experiment.controlledBottomTabs = false;

const supportedBlurEffectsSet = new Set<string>(SUPPORTED_BLUR_EFFECTS);

export function NativeTabsView(props: NativeTabsViewProps) {
  const { builder, minimizeBehavior, disableIndicator, focusedIndex } = props;
  const { state, descriptors, navigation } = builder;
  const { routes } = state;

  let blurEffect = props.blurEffect;
  if (blurEffect && !supportedBlurEffectsSet.has(blurEffect)) {
    console.warn(
      `Unsupported blurEffect: ${blurEffect}. Supported values are: ${SUPPORTED_BLUR_EFFECTS.map(
        (effect) => `"${effect}"`
      ).join(', ')}`
    );
    blurEffect = undefined;
  }

  const deferredFocusedIndex = useDeferredValue(focusedIndex);
  // We need to check if the deferred index is not out of bounds
  // This can happen when the focused index is the last tab, and user removes that tab
  // In that case the deferred index will still point to the last tab, but after re-render
  // it will be out of bounds
  const inBoundsDeferredFocusedIndex =
    deferredFocusedIndex < routes.length ? deferredFocusedIndex : focusedIndex;

  let standardAppearance = convertStyleToAppearance({
    ...props.labelStyle,
    iconColor: props.iconColor,
    blurEffect,
    backgroundColor: props.backgroundColor,
    badgeBackgroundColor: props.badgeBackgroundColor,
  });
  if (props.tintColor) {
    standardAppearance = appendSelectedStyleToAppearance(
      { iconColor: props.tintColor, color: props.tintColor },
      standardAppearance
    );
  }
  const scrollEdgeAppearance = convertStyleToAppearance({
    ...props.labelStyle,
    iconColor: props.iconColor,
    blurEffect,
    backgroundColor: props.backgroundColor,
    badgeBackgroundColor: props.badgeBackgroundColor,
  });

  const appearances = routes.map((route) => ({
    standardAppearance: createStandardAppearanceFromOptions(
      descriptors[route.key].options,
      standardAppearance
    ),
    scrollEdgeAppearance: createScrollEdgeAppearanceFromOptions(
      descriptors[route.key].options,
      scrollEdgeAppearance
    ),
  }));

  const options = routes.map((route) => descriptors[route.key].options);

  const children = routes
    .map((route, index) => ({ route, index }))
    .filter(({ route: { key } }) => shouldTabBeVisible(descriptors[key].options))
    .map(({ route, index }) => {
      const descriptor = descriptors[route.key];
      const isFocused = index === inBoundsDeferredFocusedIndex;

      return (
        <Screen
          key={route.key}
          routeKey={route.key}
          name={route.name}
          descriptor={descriptor}
          isFocused={isFocused}
          standardAppearance={appearances[index].standardAppearance}
          scrollEdgeAppearance={appearances[index].scrollEdgeAppearance}
          badgeTextColor={props.badgeTextColor}
        />
      );
    });

  const currentTabAppearance = appearances[inBoundsDeferredFocusedIndex]?.standardAppearance;

  return (
    <BottomTabsWrapper
      // #region android props
      tabBarItemTitleFontColor={currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontColor}
      tabBarItemTitleFontFamily={currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontFamily}
      tabBarItemTitleFontSize={currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontSize}
      tabBarItemTitleFontSizeActive={currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontSize}
      tabBarItemTitleFontWeight={currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontWeight}
      tabBarItemTitleFontStyle={currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontStyle}
      tabBarItemIconColor={currentTabAppearance?.stacked?.normal?.tabBarItemIconColor}
      tabBarBackgroundColor={
        currentTabAppearance?.tabBarBackgroundColor ?? props.backgroundColor ?? undefined
      }
      tabBarItemRippleColor={props.rippleColor}
      tabBarItemLabelVisibilityMode={props.labelVisibilityMode}
      tabBarItemIconColorActive={
        currentTabAppearance?.stacked?.selected?.tabBarItemIconColor ?? props?.tintColor
      }
      tabBarItemTitleFontColorActive={
        currentTabAppearance?.stacked?.selected?.tabBarItemTitleFontColor ?? props?.tintColor
      }
      // tabBarItemTitleFontSizeActive={activeStyle?.fontSize}
      tabBarItemActiveIndicatorColor={
        options[inBoundsDeferredFocusedIndex]?.indicatorColor ?? props?.indicatorColor
      }
      tabBarItemActiveIndicatorEnabled={!disableIndicator}
      // #endregion
      // #region iOS props
      tabBarTintColor={props?.tintColor}
      tabBarMinimizeBehavior={minimizeBehavior}
      // #endregion
      onNativeFocusChange={({ nativeEvent: { tabKey } }) => {
        const descriptor = descriptors[tabKey];
        const route = descriptor.route;
        navigation.dispatch({
          type: 'JUMP_TO',
          target: state.key,
          payload: {
            name: route.name,
          },
        });
      }}>
      {children}
    </BottomTabsWrapper>
  );
}

function Screen(props: {
  routeKey: string;
  name: string;
  descriptor: NativeTabsViewProps['builder']['descriptors'][string];
  isFocused: boolean;
  standardAppearance: BottomTabsScreenAppearance;
  scrollEdgeAppearance: BottomTabsScreenAppearance;
  badgeTextColor: ColorValue | undefined;
}) {
  const {
    routeKey,
    name,
    descriptor,
    isFocused,
    standardAppearance,
    scrollEdgeAppearance,
    badgeTextColor,
  } = props;
  const title = descriptor.options.title ?? name;

  const icon = useAwaitedScreensIcon(descriptor.options.icon);
  const selectedIcon = useAwaitedScreensIcon(descriptor.options.selectedIcon);

  return (
    <BottomTabsScreen
      {...descriptor.options}
      tabBarItemBadgeBackgroundColor={
        standardAppearance.stacked?.normal?.tabBarItemBadgeBackgroundColor
      }
      tabBarItemBadgeTextColor={badgeTextColor}
      standardAppearance={standardAppearance}
      scrollEdgeAppearance={scrollEdgeAppearance}
      iconResourceName={getAndroidIconResourceName(icon)}
      iconResource={getAndroidIconResource(icon)}
      icon={convertOptionsIconToPropsIcon(icon)}
      selectedIcon={convertOptionsIconToPropsIcon(selectedIcon)}
      title={title}
      freezeContents={false}
      tabKey={routeKey}
      systemItem={descriptor.options.role}
      isFocused={isFocused}>
      {descriptor.render()}
    </BottomTabsScreen>
  );
}

type AwaitedIcon =
  | {
      sf?: SFSymbol;
      drawable?: string;
    }
  | {
      src?: ImageSourcePropType;
    };

function useAwaitedScreensIcon(icon: NativeTabOptions['icon']) {
  const src = icon && typeof icon === 'object' && 'src' in icon ? icon.src : undefined;
  const [awaitedIcon, setAwaitedIcon] = useState<AwaitedIcon | undefined>(undefined);

  useEffect(() => {
    const loadIcon = async () => {
      if (src && src instanceof Promise) {
        const awaitedSrc = await src;
        if (awaitedSrc) {
          const currentAwaitedIcon = { src: awaitedSrc };
          setAwaitedIcon(currentAwaitedIcon);
        }
      }
    };
    loadIcon();
    // Checking `src` rather then icon here, to avoid unnecessary re-renders
    // The icon object can be recreated, while src should stay the same
    // In this case as we control `VectorIcon`, it will only change if `family` or `name` props change
    // So we should be safe with promise resolving
  }, [src]);

  return useMemo(() => (isAwaitedIcon(icon) ? icon : awaitedIcon), [awaitedIcon, icon]);
}

function isAwaitedIcon(icon: NativeTabOptions['icon']): icon is AwaitedIcon {
  return !icon || !('src' in icon && icon.src instanceof Promise);
}

function convertOptionsIconToPropsIcon(
  icon: AwaitedIcon | undefined
): BottomTabsScreenProps['icon'] {
  if (!icon) {
    return undefined;
  }
  if ('sf' in icon && icon.sf) {
    return { sfSymbolName: icon.sf };
  } else if ('src' in icon && icon.src) {
    return { templateSource: icon.src };
  }
  return undefined;
}

function getAndroidIconResource(
  icon: AwaitedIcon | undefined
): BottomTabsScreenProps['iconResource'] {
  if (icon && 'src' in icon && icon.src) {
    return icon.src;
  }
  return undefined;
}

function getAndroidIconResourceName(
  icon: AwaitedIcon | undefined
): BottomTabsScreenProps['iconResourceName'] {
  if (icon && 'drawable' in icon && icon.drawable) {
    return icon.drawable;
  }
  return undefined;
}

const supportedTabBarMinimizeBehaviorsSet = new Set<string>(SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS);
const supportedTabBarItemLabelVisibilityModesSet = new Set<string>(
  SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES
);

function BottomTabsWrapper(props: BottomTabsProps) {
  let { tabBarMinimizeBehavior, tabBarItemLabelVisibilityMode, ...rest } = props;
  if (tabBarMinimizeBehavior && !supportedTabBarMinimizeBehaviorsSet.has(tabBarMinimizeBehavior)) {
    console.warn(
      `Unsupported minimizeBehavior: ${tabBarMinimizeBehavior}. Supported values are: ${SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS.map((behavior) => `"${behavior}"`).join(', ')}`
    );
    tabBarMinimizeBehavior = undefined;
  }
  if (
    tabBarItemLabelVisibilityMode &&
    !supportedTabBarItemLabelVisibilityModesSet.has(tabBarItemLabelVisibilityMode)
  ) {
    console.warn(
      `Unsupported labelVisibilityMode: ${tabBarItemLabelVisibilityMode}. Supported values are: ${SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES.map((mode) => `"${mode}"`).join(', ')}`
    );
    tabBarItemLabelVisibilityMode = undefined;
  }

  return (
    <BottomTabs
      tabBarItemLabelVisibilityMode={tabBarItemLabelVisibilityMode}
      tabBarMinimizeBehavior={tabBarMinimizeBehavior}
      {...rest}
    />
  );
}
