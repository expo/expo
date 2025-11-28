import { useTheme } from '@react-navigation/native';
import React, { useDeferredValue } from 'react';
import { View, type ColorValue } from 'react-native';
import {
  BottomTabs,
  BottomTabsScreen,
  featureFlags,
  type BottomTabsProps,
  type BottomTabsScreenAppearance,
} from 'react-native-screens';

import {
  createScrollEdgeAppearanceFromOptions,
  createStandardAppearanceFromOptions,
} from './appearance';
import {
  SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES,
  SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS,
  type NativeTabOptions,
  type NativeTabsViewProps,
} from './types';
import {
  convertOptionsIconToRNScreensPropsIcon,
  convertOptionsIconToIOSPropsIcon,
  useAwaitedScreensIcon,
} from './utils/icon';

// We let native tabs to control the changes. This requires freeze to be disabled for tab bar.
// Otherwise user may see glitches when switching between tabs.
featureFlags.experiment.controlledBottomTabs = false;

export function NativeTabsView(props: NativeTabsViewProps) {
  const { minimizeBehavior, disableIndicator, focusedIndex, tabs, sidebarAdaptable } = props;

  const deferredFocusedIndex = useDeferredValue(focusedIndex);
  // We need to check if the deferred index is not out of bounds
  // This can happen when the focused index is the last tab, and user removes that tab
  // In that case the deferred index will still point to the last tab, but after re-render
  // it will be out of bounds
  const inBoundsDeferredFocusedIndex =
    deferredFocusedIndex < tabs.length ? deferredFocusedIndex : focusedIndex;

  const appearances = tabs.map((tab) => ({
    standardAppearance: createStandardAppearanceFromOptions(tab.options),
    scrollEdgeAppearance: createScrollEdgeAppearanceFromOptions(tab.options),
  }));

  const options = tabs.map((tab) => tab.options);

  const children = tabs.map((tab, index) => {
    const isFocused = index === inBoundsDeferredFocusedIndex;

    return (
      <Screen
        key={tab.routeKey}
        routeKey={tab.routeKey}
        name={tab.name}
        options={tab.options}
        isFocused={isFocused}
        standardAppearance={appearances[index].standardAppearance}
        scrollEdgeAppearance={appearances[index].scrollEdgeAppearance}
        badgeTextColor={tab.options.badgeTextColor}
        contentRenderer={tab.contentRenderer}
      />
    );
  });

  const currentTabAppearance = appearances[inBoundsDeferredFocusedIndex]?.standardAppearance;
  const tabBarControllerMode: BottomTabsProps['tabBarControllerMode'] = sidebarAdaptable
    ? 'tabSidebar'
    : sidebarAdaptable === false
      ? 'tabBar'
      : 'automatic';

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
      tabBarBackgroundColor={currentTabAppearance?.tabBarBackgroundColor}
      tabBarItemRippleColor={props.rippleColor}
      tabBarItemLabelVisibilityMode={props.labelVisibilityMode}
      tabBarItemIconColorActive={
        currentTabAppearance?.stacked?.selected?.tabBarItemIconColor ?? props?.tintColor
      }
      tabBarItemTitleFontColorActive={
        currentTabAppearance?.stacked?.selected?.tabBarItemTitleFontColor ?? props?.tintColor
      }
      // tabBarItemTitleFontSizeActive={activeStyle?.fontSize}
      tabBarItemActiveIndicatorColor={options[inBoundsDeferredFocusedIndex]?.indicatorColor}
      tabBarItemActiveIndicatorEnabled={!disableIndicator}
      // #endregion
      // #region iOS props
      tabBarTintColor={props?.tintColor}
      tabBarMinimizeBehavior={minimizeBehavior}
      tabBarControllerMode={tabBarControllerMode}
      // #endregion
      onNativeFocusChange={({ nativeEvent: { tabKey } }) => {
        props.onTabChange(tabKey);
      }}>
      {children}
    </BottomTabsWrapper>
  );
}

function Screen(props: {
  routeKey: string;
  name: string;
  isFocused: boolean;
  options: NativeTabOptions;
  standardAppearance: BottomTabsScreenAppearance;
  scrollEdgeAppearance: BottomTabsScreenAppearance;
  badgeTextColor: ColorValue | undefined;
  contentRenderer: () => React.ReactNode;
}) {
  const {
    routeKey,
    name,
    options,
    isFocused,
    standardAppearance,
    scrollEdgeAppearance,
    badgeTextColor,
    contentRenderer,
  } = props;
  const title = options.title ?? name;

  // We need to await the icon, as VectorIcon will load asynchronously
  const icon = useAwaitedScreensIcon(options.icon);
  const selectedIcon = useAwaitedScreensIcon(options.selectedIcon);
  const { colors } = useTheme();

  return (
    <BottomTabsScreen
      {...options}
      tabBarItemBadgeBackgroundColor={
        standardAppearance.stacked?.normal?.tabBarItemBadgeBackgroundColor
      }
      tabBarItemBadgeTextColor={badgeTextColor}
      standardAppearance={standardAppearance}
      scrollEdgeAppearance={scrollEdgeAppearance}
      icon={convertOptionsIconToRNScreensPropsIcon(icon)}
      selectedIcon={convertOptionsIconToIOSPropsIcon(selectedIcon)}
      title={title}
      freezeContents={false}
      systemItem={options.role}
      {...options.nativeProps}
      tabKey={routeKey}
      isFocused={isFocused}>
      <View
        // https://github.com/software-mansion/react-native-screens/issues/2662#issuecomment-2757735088
        collapsable={false}
        style={[
          { backgroundColor: colors.background },
          options.contentStyle,
          { flex: 1, position: 'relative', overflow: 'hidden' },
        ]}>
        {contentRenderer()}
      </View>
    </BottomTabsScreen>
  );
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
