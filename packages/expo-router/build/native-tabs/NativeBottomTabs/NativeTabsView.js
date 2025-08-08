"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabsView = NativeTabsView;
const react_1 = __importDefault(require("react"));
const react_native_screens_1 = require("react-native-screens");
const utils_1 = require("./utils");
const linking_1 = require("../../link/linking");
// We let native tabs to control the changes. This requires freeze to be disabled for tab bar.
// Otherwise user may see glitches when switching between tabs.
react_native_screens_1.featureFlags.experiment.controlledBottomTabs = false;
// TODO: ENG-16896: Enable freeze globally and disable only for NativeTabsView
(0, react_native_screens_1.enableFreeze)(false);
// TODO: Add support for dynamic params inside a route
function NativeTabsView(props) {
    const { builder, style, minimizeBehavior, disableIndicator } = props;
    const { state, descriptors, navigation } = builder;
    const { routes } = state;
    let focusedIndex = state.index;
    const isAnyRouteFocused = routes[focusedIndex].key &&
        descriptors[routes[focusedIndex].key] &&
        (0, utils_1.shouldTabBeVisible)(descriptors[routes[focusedIndex].key].options);
    if (!isAnyRouteFocused) {
        if (process.env.NODE_ENV !== 'production') {
            throw new Error(`The focused tab in NativeTabsView cannot be displayed. Make sure path is correct and the route is not hidden. Path: "${(0, linking_1.getPathFromState)(state)}"`);
        }
        // Set focusedIndex to the first visible tab
        focusedIndex = routes.findIndex((route) => (0, utils_1.shouldTabBeVisible)(descriptors[route.key].options));
    }
    const children = routes
        .map((route, index) => ({ route, index }))
        .filter(({ route: { key } }) => (0, utils_1.shouldTabBeVisible)(descriptors[key].options))
        .map(({ route, index }) => {
        const descriptor = descriptors[route.key];
        const isFocused = state.index === index;
        const title = descriptor.options.title ?? route.name;
        return (<react_native_screens_1.BottomTabsScreen key={route.key} {...descriptor.options} iconResourceName={descriptor.options.icon?.drawable} icon={convertOptionsIconToPropsIcon(descriptor.options.icon)} selectedIcon={convertOptionsIconToPropsIcon(descriptor.options.selectedIcon)} title={title} tabKey={route.key} isFocused={isFocused}>
          {descriptor.render()}
        </react_native_screens_1.BottomTabsScreen>);
    });
    return (<react_native_screens_1.BottomTabs tabBarItemTitleFontColor={style?.color} tabBarItemTitleFontFamily={style?.fontFamily} tabBarItemTitleFontSize={style?.fontSize} tabBarItemTitleFontWeight={style?.fontWeight} tabBarItemTitleFontStyle={style?.fontStyle} tabBarBackgroundColor={style?.backgroundColor} tabBarBlurEffect={style?.blurEffect} tabBarTintColor={style?.tintColor} tabBarItemBadgeBackgroundColor={style?.badgeBackgroundColor} tabBarItemRippleColor={style?.rippleColor} tabBarItemLabelVisibilityMode={style?.labelVisibilityMode} tabBarItemIconColor={style?.iconColor} tabBarItemIconColorActive={style?.['&:active']?.iconColor ?? style?.tintColor} tabBarItemTitleFontColorActive={style?.['&:active']?.color ?? style?.tintColor} tabBarItemTitleFontSizeActive={style?.['&:active']?.fontSize} tabBarItemActiveIndicatorColor={style?.['&:active']?.indicatorColor} tabBarItemActiveIndicatorEnabled={!disableIndicator} tabBarMinimizeBehavior={minimizeBehavior} onNativeFocusChange={({ nativeEvent: { tabKey } }) => {
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
    </react_native_screens_1.BottomTabs>);
}
function convertOptionsIconToPropsIcon(icon) {
    if (!icon) {
        return undefined;
    }
    if ('sf' in icon && icon.sf) {
        return { sfSymbolName: icon.sf };
    }
    else if ('src' in icon && icon.src) {
        return { templateSource: icon.src };
    }
    return undefined;
}
//# sourceMappingURL=NativeTabsView.js.map