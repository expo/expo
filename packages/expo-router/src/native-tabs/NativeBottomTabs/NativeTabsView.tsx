import React, { useRef } from 'react';
import {
  BottomTabs,
  BottomTabsScreen,
  featureFlags,
  type BottomTabsScreenProps,
} from 'react-native-screens';

import type { NativeTabOptions, NativeTabsViewProps } from './types';
import { shouldTabBeVisible } from './utils';

// We let native tabs to control the changes. This requires freeze to be disabled for tab bar.
// Otherwise user may see glitches when switching between tabs.
featureFlags.experiment.controlledBottomTabs = false;

export function NativeTabsView(props: NativeTabsViewProps) {
  const { builder, style, minimizeBehavior, disableIndicator, focusedIndex } = props;
  const { state, descriptors, navigation } = builder;
  const { routes } = state;

  // This is flag that is set to true, when the transition is executed by native tab change
  // In this case we don't need to change the isFocused of the screens, because the transition will happen on native side
  const isDuringNativeTransition = useRef<boolean>(false);
  // This is the last index that was not part of a native transition, e.g navigation from link
  const lastNotNativeTransitionIndex = useRef<number>(focusedIndex);

  // If the flag was set in the onNativeFocusChange handler, it will be still true here
  // It is set to false, later in this function
  // Thus if it is false, we know that the transition was not triggered by a native tab change
  // and we need to reset the lastNotNativeTransitionIndex
  if (!isDuringNativeTransition.current) {
    lastNotNativeTransitionIndex.current = focusedIndex;
  }

  const children = routes
    .map((route, index) => ({ route, index }))
    .filter(({ route: { key } }) => shouldTabBeVisible(descriptors[key].options))
    .map(({ route, index }) => {
      const descriptor = descriptors[route.key];
      // In case of native transition we want to keep the last focused index
      // Otherwise the lastNotNativeTransitionIndex is set to focusedIndex in the if above this statement
      const isFocused = index === focusedIndex;
      // TODO: Find a proper fix, that allows for proper JS navigation
      //lastNotNativeTransitionIndex.current;
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

  // The native render is over, we can reset the flag
  isDuringNativeTransition.current = false;

  return (
    <BottomTabs
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
        isDuringNativeTransition.current = true;
      }}>
      {children}
    </BottomTabs>
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
