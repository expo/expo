"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabsView = NativeTabsView;
const react_1 = __importStar(require("react"));
const react_native_screens_1 = require("react-native-screens");
const utils_1 = require("./utils");
// We let native tabs to control the changes. This requires freeze to be disabled for tab bar.
// Otherwise user may see glitches when switching between tabs.
react_native_screens_1.featureFlags.experiment.controlledBottomTabs = false;
// TODO: ENG-16896: Enable freeze globally and disable only for NativeTabsView
(0, react_native_screens_1.enableFreeze)(false);
// TODO: Add support for dynamic params inside a route
function NativeTabsView(props) {
    const { builder, style, minimizeBehavior, disableIndicator, focusedIndex } = props;
    const { state, descriptors, navigation } = builder;
    const { routes } = state;
    const deferredFocusedIndex = (0, react_1.useDeferredValue)(focusedIndex);
    const children = routes
        .map((route, index) => ({ route, index }))
        .filter(({ route: { key } }) => (0, utils_1.shouldTabBeVisible)(descriptors[key].options))
        .map(({ route, index }) => {
        const descriptor = descriptors[route.key];
        const isFocused = index === deferredFocusedIndex;
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