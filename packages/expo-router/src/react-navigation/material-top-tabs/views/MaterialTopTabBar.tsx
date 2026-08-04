import type { ColorValue } from 'react-native';
import { StyleSheet } from 'react-native';

import { Color } from '../../../utils/color';
import { Text } from '../../elements';
import { useLinkBuilder, useLocale, useTheme } from '../../native';
import type { MaterialTopTabBarProps } from '../types';

// Use dynamic import to avoid having direct dependency on react-native-tab-view.
// import { TabBar, TabBarIndicator } from 'react-native-tab-view';
let TabBar: typeof import('react-native-tab-view').TabBar;
let TabBarIndicator: typeof import('react-native-tab-view').TabBarIndicator;
try {
  const tabViewModule = require('react-native-tab-view');
  TabBar = tabViewModule.TabBar;
  TabBarIndicator = tabViewModule.TabBarIndicator;
} catch (e) {
  throw new Error(
    "Install the 'react-native-tab-view' package and its peer dependencies to use the Expo Router's TopTabs."
  );
}

const renderLabelDefault = ({ color, labelText, style, allowFontScaling }: any) => {
  return (
    <Text style={[{ color }, styles.label, style]} allowFontScaling={allowFontScaling}>
      {labelText}
    </Text>
  );
};

export function MaterialTopTabBar({
  state,
  descriptors,
  emitter,
  // The built-in bar switches through `jumpTo`; only strip the custom callback from forwarded props.
  navigateToTab: _navigateToTab,
  ...rest
}: MaterialTopTabBarProps) {
  const { colors } = useTheme();
  const { direction } = useLocale();
  const { buildHref } = useLinkBuilder();

  const focusedRoute = state.routes[state.index]!;
  const focusedOptions = descriptors[focusedRoute.key]!.options;

  const activeColor: ColorValue = focusedOptions.tabBarActiveTintColor ?? colors.primary;
  const inactiveColor: ColorValue =
    focusedOptions.tabBarInactiveTintColor ??
    Color(activeColor)?.alpha(0.5).string() ??
    colors.text;

  const tabBarOptions = Object.fromEntries(
    state.routes.map((route: any) => {
      const { options } = descriptors[route.key]!;

      const {
        title,
        tabBarLabel,
        tabBarButtonTestID,
        tabBarAccessibilityLabel,
        tabBarBadge,
        tabBarShowIcon,
        tabBarShowLabel,
        tabBarIcon,
        tabBarAllowFontScaling,
        tabBarLabelStyle,
      } = options;

      return [
        route.key,
        {
          href: buildHref(route.name, route.params),
          testID: tabBarButtonTestID,
          accessibilityLabel: tabBarAccessibilityLabel,
          badge: tabBarBadge,
          icon: tabBarShowIcon === false ? undefined : tabBarIcon,
          label:
            tabBarShowLabel === false
              ? undefined
              : typeof tabBarLabel === 'function'
                ? ({ labelText, color }: any) =>
                    tabBarLabel({
                      focused: focusedRoute.key === route.key,
                      color,
                      children: labelText ?? route.name,
                    })
                : renderLabelDefault,
          labelAllowFontScaling: tabBarAllowFontScaling,
          labelStyle: tabBarLabelStyle,
          labelText:
            options.tabBarShowLabel === false
              ? undefined
              : typeof tabBarLabel === 'string'
                ? tabBarLabel
                : title !== undefined
                  ? title
                  : route.name,
        },
      ];
    })
  );

  return (
    <TabBar
      {...rest}
      navigationState={state}
      options={tabBarOptions}
      direction={direction}
      scrollEnabled={focusedOptions.tabBarScrollEnabled}
      bounces={focusedOptions.tabBarBounces}
      activeColor={activeColor as string}
      inactiveColor={inactiveColor as string}
      pressColor={focusedOptions.tabBarPressColor as string | undefined}
      pressOpacity={focusedOptions.tabBarPressOpacity}
      tabStyle={focusedOptions.tabBarItemStyle}
      indicatorStyle={[{ backgroundColor: colors.primary }, focusedOptions.tabBarIndicatorStyle]}
      gap={focusedOptions.tabBarGap}
      android_ripple={focusedOptions.tabBarAndroidRipple}
      indicatorContainerStyle={focusedOptions.tabBarIndicatorContainerStyle}
      contentContainerStyle={focusedOptions.tabBarContentContainerStyle}
      style={[{ backgroundColor: colors.card }, focusedOptions.tabBarStyle]}
      onTabPress={({ route, preventDefault }: any) => {
        const event = emitter.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });

        if (event.defaultPrevented) {
          preventDefault();
        }
      }}
      onTabLongPress={({ route }: any) =>
        emitter.emit({
          type: 'tabLongPress',
          target: route.key,
        })
      }
      renderIndicator={({ navigationState: state, ...rest }: any) => {
        return focusedOptions.tabBarIndicator ? (
          focusedOptions.tabBarIndicator({
            state,
            ...rest,
          })
        ) : (
          <TabBarIndicator navigationState={state} {...rest} />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  label: {
    textAlign: 'center',
    fontSize: 14,
    margin: 4,
    backgroundColor: 'transparent',
  },
});
