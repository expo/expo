import Color from 'color';
import { StyleSheet } from 'react-native';

import { Text } from '../../elements';
import {
  type ParamListBase,
  type TabNavigationState,
  useLinkBuilder,
  useLocale,
  useTheme,
} from '../../native';
import type { MaterialTopTabBarProps } from '../types';

// import { TabBar, TabBarIndicator } from 'react-native-tab-view';
let TabBar: any;
let TabBarIndicator: any;
try {
  const tabViewModule = require('react-native-tab-view');
  TabBar = tabViewModule.TabBar;
  TabBarIndicator = tabViewModule.TabBarIndicator;
} catch (e) {
  throw new Error(
    "Install the 'react-native-tab-view' package and its peer dependencies to use the MaterialTopTabs."
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
  navigation,
  descriptors,
  ...rest
}: MaterialTopTabBarProps) {
  const { colors } = useTheme();
  const { direction } = useLocale();
  const { buildHref } = useLinkBuilder();

  const focusedOptions = descriptors[state.routes[state.index].key].options;

  const activeColor = focusedOptions.tabBarActiveTintColor ?? colors.text;
  const inactiveColor =
    focusedOptions.tabBarInactiveTintColor ?? Color(activeColor).alpha(0.5).rgb().string();

  const tabBarOptions = Object.fromEntries(
    state.routes.map((route: any) => {
      const { options } = descriptors[route.key];

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
                      focused: state.routes[state.index].key === route.key,
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
      activeColor={activeColor}
      inactiveColor={inactiveColor}
      pressColor={focusedOptions.tabBarPressColor}
      pressOpacity={focusedOptions.tabBarPressOpacity}
      tabStyle={focusedOptions.tabBarItemStyle}
      indicatorStyle={[{ backgroundColor: colors.primary }, focusedOptions.tabBarIndicatorStyle]}
      gap={focusedOptions.tabBarGap}
      android_ripple={focusedOptions.tabBarAndroidRipple}
      indicatorContainerStyle={focusedOptions.tabBarIndicatorContainerStyle}
      contentContainerStyle={focusedOptions.tabBarContentContainerStyle}
      style={[{ backgroundColor: colors.card }, focusedOptions.tabBarStyle]}
      onTabPress={({ route, preventDefault }: any) => {
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });

        if (event.defaultPrevented) {
          preventDefault();
        }
      }}
      onTabLongPress={({ route }: any) =>
        navigation.emit({
          type: 'tabLongPress',
          target: route.key,
        })
      }
      renderIndicator={({ navigationState: state, ...rest }: any) => {
        return focusedOptions.tabBarIndicator ? (
          focusedOptions.tabBarIndicator({
            state: state as TabNavigationState<ParamListBase>,
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
