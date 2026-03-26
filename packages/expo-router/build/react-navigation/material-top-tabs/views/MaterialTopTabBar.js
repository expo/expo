"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialTopTabBar = MaterialTopTabBar;
const color_1 = __importDefault(require("color"));
const react_native_1 = require("react-native");
const elements_1 = require("../../elements");
const native_1 = require("../../native");
// import { TabBar, TabBarIndicator } from 'react-native-tab-view';
let TabBar;
let TabBarIndicator;
try {
    const tabViewModule = require('react-native-tab-view');
    TabBar = tabViewModule.TabBar;
    TabBarIndicator = tabViewModule.TabBarIndicator;
}
catch (e) {
    throw new Error("Install the 'react-native-tab-view' package and its peer dependencies to use the MaterialTopTabs.");
}
const renderLabelDefault = ({ color, labelText, style, allowFontScaling }) => {
    return (<elements_1.Text style={[{ color }, styles.label, style]} allowFontScaling={allowFontScaling}>
      {labelText}
    </elements_1.Text>);
};
function MaterialTopTabBar({ state, navigation, descriptors, ...rest }) {
    const { colors } = (0, native_1.useTheme)();
    const { direction } = (0, native_1.useLocale)();
    const { buildHref } = (0, native_1.useLinkBuilder)();
    const focusedOptions = descriptors[state.routes[state.index].key].options;
    const activeColor = focusedOptions.tabBarActiveTintColor ?? colors.text;
    const inactiveColor = focusedOptions.tabBarInactiveTintColor ?? (0, color_1.default)(activeColor).alpha(0.5).rgb().string();
    const tabBarOptions = Object.fromEntries(state.routes.map((route) => {
        const { options } = descriptors[route.key];
        const { title, tabBarLabel, tabBarButtonTestID, tabBarAccessibilityLabel, tabBarBadge, tabBarShowIcon, tabBarShowLabel, tabBarIcon, tabBarAllowFontScaling, tabBarLabelStyle, } = options;
        return [
            route.key,
            {
                href: buildHref(route.name, route.params),
                testID: tabBarButtonTestID,
                accessibilityLabel: tabBarAccessibilityLabel,
                badge: tabBarBadge,
                icon: tabBarShowIcon === false ? undefined : tabBarIcon,
                label: tabBarShowLabel === false
                    ? undefined
                    : typeof tabBarLabel === 'function'
                        ? ({ labelText, color }) => tabBarLabel({
                            focused: state.routes[state.index].key === route.key,
                            color,
                            children: labelText ?? route.name,
                        })
                        : renderLabelDefault,
                labelAllowFontScaling: tabBarAllowFontScaling,
                labelStyle: tabBarLabelStyle,
                labelText: options.tabBarShowLabel === false
                    ? undefined
                    : typeof tabBarLabel === 'string'
                        ? tabBarLabel
                        : title !== undefined
                            ? title
                            : route.name,
            },
        ];
    }));
    return (<TabBar {...rest} navigationState={state} options={tabBarOptions} direction={direction} scrollEnabled={focusedOptions.tabBarScrollEnabled} bounces={focusedOptions.tabBarBounces} activeColor={activeColor} inactiveColor={inactiveColor} pressColor={focusedOptions.tabBarPressColor} pressOpacity={focusedOptions.tabBarPressOpacity} tabStyle={focusedOptions.tabBarItemStyle} indicatorStyle={[{ backgroundColor: colors.primary }, focusedOptions.tabBarIndicatorStyle]} gap={focusedOptions.tabBarGap} android_ripple={focusedOptions.tabBarAndroidRipple} indicatorContainerStyle={focusedOptions.tabBarIndicatorContainerStyle} contentContainerStyle={focusedOptions.tabBarContentContainerStyle} style={[{ backgroundColor: colors.card }, focusedOptions.tabBarStyle]} onTabPress={({ route, preventDefault }) => {
            const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
            });
            if (event.defaultPrevented) {
                preventDefault();
            }
        }} onTabLongPress={({ route }) => navigation.emit({
            type: 'tabLongPress',
            target: route.key,
        })} renderIndicator={({ navigationState: state, ...rest }) => {
            return focusedOptions.tabBarIndicator ? (focusedOptions.tabBarIndicator({
                state: state,
                ...rest,
            })) : (<TabBarIndicator navigationState={state} {...rest}/>);
        }}/>);
}
const styles = react_native_1.StyleSheet.create({
    label: {
        textAlign: 'center',
        fontSize: 14,
        margin: 4,
        backgroundColor: 'transparent',
    },
});
//# sourceMappingURL=MaterialTopTabBar.js.map