import React, { useDeferredValue, useEffect } from 'react';
import { Text, View, type ColorValue } from 'react-native';
import {
  BottomTabs,
  BottomTabsScreen,
  featureFlags,
  type BottomTabsProps,
  type BottomTabsScreenAppearance,
  type BottomTabsScreenProps,
} from 'react-native-screens';

import {
  appendSelectedStyleToAppearance,
  convertStyleToAppearance,
  createScrollEdgeAppearanceFromOptions,
  createStandardAppearanceFromOptions,
} from './appearance';
import {
  SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES,
  SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS,
  type NativeTabOptions,
  type NativeTabsViewProps,
} from './types';
import { shouldTabBeVisible } from './utils';
import { NativeBottomAccessory } from '../botom-accessory/native';

// We let native tabs to control the changes. This requires freeze to be disabled for tab bar.
// Otherwise user may see glitches when switching between tabs.
featureFlags.experiment.controlledBottomTabs = false;

export function NativeTabsView(props: NativeTabsViewProps) {
  const {
    builder,
    minimizeBehavior,
    disableIndicator,
    focusedIndex,
    disableTransparentOnScrollEdge,
  } = props;
  const { state, descriptors, navigation } = builder;
  const { routes } = state;

  const deferredFocusedIndex = useDeferredValue(focusedIndex);
  let standardAppearance = convertStyleToAppearance({
    ...props.labelStyle,
    iconColor: props.iconColor,
    blurEffect: props.blurEffect,
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
    blurEffect: disableTransparentOnScrollEdge ? props.blurEffect : 'none',
    backgroundColor: disableTransparentOnScrollEdge ? props.backgroundColor : null,
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
      const isFocused = index === deferredFocusedIndex;

      return (
        <Screen
          key={route.key}
          routeKey={route.key}
          name={route.name}
          descriptor={descriptor}
          isFocused={isFocused}
          // This will not work with first route hidden
          isFirst={index === 0}
          standardAppearance={appearances[index].standardAppearance}
          scrollEdgeAppearance={appearances[index].scrollEdgeAppearance}
          badgeTextColor={props.badgeTextColor}
        />
      );
    });

  return (
    <BottomTabsWrapper
      // #region android props
      tabBarItemTitleFontColor={
        appearances[deferredFocusedIndex].standardAppearance.stacked?.normal
          ?.tabBarItemTitleFontColor
      }
      tabBarItemTitleFontFamily={
        appearances[deferredFocusedIndex].standardAppearance.stacked?.normal
          ?.tabBarItemTitleFontFamily
      }
      tabBarItemTitleFontSize={
        appearances[deferredFocusedIndex].standardAppearance.stacked?.normal
          ?.tabBarItemTitleFontSize
      }
      tabBarItemTitleFontSizeActive={
        appearances[deferredFocusedIndex].standardAppearance.stacked?.normal
          ?.tabBarItemTitleFontSize
      }
      tabBarItemTitleFontWeight={
        appearances[deferredFocusedIndex].standardAppearance.stacked?.normal
          ?.tabBarItemTitleFontWeight
      }
      tabBarItemTitleFontStyle={
        appearances[deferredFocusedIndex].standardAppearance.stacked?.normal
          ?.tabBarItemTitleFontStyle
      }
      tabBarItemIconColor={
        appearances[deferredFocusedIndex].standardAppearance.stacked?.normal?.tabBarItemIconColor
      }
      tabBarBackgroundColor={
        appearances[deferredFocusedIndex].standardAppearance.tabBarBackgroundColor ??
        props.backgroundColor ??
        undefined
      }
      tabBarItemRippleColor={props.rippleColor}
      tabBarItemLabelVisibilityMode={props.labelVisibilityMode}
      tabBarItemIconColorActive={
        appearances[deferredFocusedIndex].standardAppearance?.stacked?.selected
          ?.tabBarItemIconColor ?? props?.tintColor
      }
      tabBarItemTitleFontColorActive={
        appearances[deferredFocusedIndex].standardAppearance?.stacked?.selected
          ?.tabBarItemTitleFontColor ?? props?.tintColor
      }
      // tabBarItemTitleFontSizeActive={activeStyle?.fontSize}
      tabBarItemActiveIndicatorColor={
        options[deferredFocusedIndex]?.indicatorColor ?? props?.indicatorColor
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
  isFirst: boolean;
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

  let icon = convertOptionsIconToPropsIcon(descriptor.options.icon);

  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    return () => setIsMounted(false);
  }, []);

  // Fix for an issue in screens
  if (descriptor.options.role) {
    switch (descriptor.options.role) {
      case 'search':
        icon = { sfSymbolName: 'magnifyingglass' };
    }
  }

  return (
    <BottomTabsScreen
      {...descriptor.options}
      tabBarItemBadgeBackgroundColor={
        standardAppearance.stacked?.normal?.tabBarItemBadgeBackgroundColor
      }
      tabBarItemBadgeTextColor={badgeTextColor}
      standardAppearance={standardAppearance}
      scrollEdgeAppearance={scrollEdgeAppearance}
      iconResourceName={getAndroidIconResourceName(descriptor.options.icon)}
      iconResource={getAndroidIconResource(descriptor.options.icon)}
      icon={icon}
      selectedIcon={convertOptionsIconToPropsIcon(descriptor.options.selectedIcon)}
      title={title}
      freezeContents={false}
      onWillAppear={() => setIsMounted(true)}
      tabKey={routeKey}
      systemItem={descriptor.options.role}
      isFocused={isFocused}>
      {descriptor.render()}
      {props.isFirst && isMounted && (
        <NativeBottomAccessory onLayout={() => console.log('layout')}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 24,
              backgroundColor: 'rgba(255,0,0,0.25)',
            }}>
            <Text style={{ padding: 8, backgroundColor: 'white' }}>Test</Text>
            <Text>Test</Text>
          </View>
        </NativeBottomAccessory>
      )}
    </BottomTabsScreen>
  );
}

function convertOptionsIconToPropsIcon(
  icon: NativeTabOptions['icon']
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
  icon: NativeTabOptions['icon']
): BottomTabsScreenProps['iconResource'] {
  if (icon && 'src' in icon && icon.src) {
    return icon.src;
  }
  return undefined;
}

function getAndroidIconResourceName(
  icon: NativeTabOptions['icon']
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
