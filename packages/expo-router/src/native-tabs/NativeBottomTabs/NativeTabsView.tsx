import React, { useDeferredValue } from 'react';
import {
  BottomTabs,
  BottomTabsScreen,
  featureFlags,
  type BottomTabsProps,
  type BottomTabsScreenProps,
} from 'react-native-screens';

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

export function NativeTabsView(props: NativeTabsViewProps) {
  const { builder, style, minimizeBehavior, disableIndicator, focusedIndex } = props;
  const { state, descriptors, navigation } = builder;
  const { routes } = state;

  const deferredFocusedIndex = useDeferredValue(focusedIndex);

  const children = routes
    .map((route, index) => ({ route, index }))
    .filter(({ route: { key } }) => shouldTabBeVisible(descriptors[key].options))
    .map(({ route, index }) => {
      const descriptor = descriptors[route.key];
      const isFocused = index === deferredFocusedIndex;
      const title = descriptor.options.title ?? route.name;

      return (
        <BottomTabsScreen
          key={route.key}
          {...descriptor.options}
          tabBarItemBadgeBackgroundColor={style?.badgeBackgroundColor}
          tabBarItemBadgeTextColor={style?.badgeTextColor}
          tabBarItemTitlePositionAdjustment={style?.titlePositionAdjustment}
          iconResourceName={descriptor.options.icon?.drawable}
          icon={convertOptionsIconToPropsIcon(descriptor.options.icon)}
          selectedIcon={convertOptionsIconToPropsIcon(descriptor.options.selectedIcon)}
          title={title}
          freezeContents={false}
          tabKey={route.key}
          isFocused={isFocused}>
          {descriptor.render()}
        </BottomTabsScreen>
      );
    });

  return (
    <BottomTabsWrapper
      tabBarItemTitleFontColor={style?.color}
      tabBarItemTitleFontFamily={style?.fontFamily}
      tabBarItemTitleFontSize={style?.fontSize}
      // Only string values are accepted by screens
      tabBarItemTitleFontWeight={
        style?.fontWeight
          ? (String(style.fontWeight) as `${NonNullable<(typeof style)['fontWeight']>}`)
          : undefined
      }
      tabBarItemTitleFontStyle={style?.fontStyle}
      tabBarBackgroundColor={style?.backgroundColor}
      tabBarBlurEffect={style?.blurEffect}
      tabBarTintColor={style?.tintColor}
      tabBarItemBadgeBackgroundColor={style?.badgeBackgroundColor}
      tabBarItemRippleColor={style?.rippleColor}
      tabBarItemLabelVisibilityMode={style?.labelVisibilityMode}
      tabBarItemIconColor={style?.iconColor}
      tabBarItemIconColorActive={style?.['&:active']?.iconColor ?? style?.tintColor}
      tabBarItemTitleFontColorActive={style?.['&:active']?.color ?? style?.tintColor}
      tabBarItemTitleFontSizeActive={style?.['&:active']?.fontSize}
      tabBarItemActiveIndicatorColor={style?.['&:active']?.indicatorColor}
      tabBarItemActiveIndicatorEnabled={!disableIndicator}
      tabBarMinimizeBehavior={minimizeBehavior}
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

const supportedTabBarMinimizeBehaviorsSet = new Set<string>(SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS);
const supportedTabBarItemLabelVisibilityModesSet = new Set<string>(
  SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES
);
const supportedBlurEffectsSet = new Set<string>(SUPPORTED_BLUR_EFFECTS);

function BottomTabsWrapper(props: BottomTabsProps) {
  const { tabBarMinimizeBehavior, tabBarItemLabelVisibilityMode, tabBarBlurEffect, ...rest } =
    props;
  if (tabBarMinimizeBehavior && !supportedTabBarMinimizeBehaviorsSet.has(tabBarMinimizeBehavior)) {
    throw new Error(
      `Unsupported minimizeBehavior: ${tabBarMinimizeBehavior}. Supported values are: ${SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS.map((behavior) => `"${behavior}"`).join(', ')}`
    );
  }
  if (
    tabBarItemLabelVisibilityMode &&
    !supportedTabBarItemLabelVisibilityModesSet.has(tabBarItemLabelVisibilityMode)
  ) {
    throw new Error(
      `Unsupported labelVisibilityMode: ${tabBarItemLabelVisibilityMode}. Supported values are: ${SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES.map((mode) => `"${mode}"`).join(', ')}`
    );
  }
  if (tabBarBlurEffect && !supportedBlurEffectsSet.has(tabBarBlurEffect)) {
    throw new Error(
      `Unsupported blurEffect: ${tabBarBlurEffect}. Supported values are: ${SUPPORTED_BLUR_EFFECTS.map((effect) => `"${effect}"`).join(', ')}`
    );
  }

  return (
    <BottomTabs
      tabBarBlurEffect={tabBarBlurEffect}
      tabBarItemLabelVisibilityMode={tabBarItemLabelVisibilityMode}
      tabBarMinimizeBehavior={tabBarMinimizeBehavior}
      {...rest}
    />
  );
}
