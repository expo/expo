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
const types_1 = require("./types");
const utils_1 = require("./utils");
// We let native tabs to control the changes. This requires freeze to be disabled for tab bar.
// Otherwise user may see glitches when switching between tabs.
react_native_screens_1.featureFlags.experiment.controlledBottomTabs = false;
function NativeTabsView(props) {
    const { builder, style, minimizeBehavior, disableIndicator, focusedIndex } = props;
    const { state, descriptors, navigation } = builder;
    const { routes } = state;
    // This is flag that is set to true, when the transition is executed by native tab change
    // In this case we don't need to change the isFocused of the screens, because the transition will happen on native side
    const isDuringNativeTransition = (0, react_1.useRef)(false);
    // This is the last index that was not part of a native transition, e.g navigation from link
    const lastNotNativeTransitionIndex = (0, react_1.useRef)(focusedIndex);
    // If the flag was set in the onNativeFocusChange handler, it will be still true here
    // It is set to false, later in this function
    // Thus if it is false, we know that the transition was not triggered by a native tab change
    // and we need to reset the lastNotNativeTransitionIndex
    if (!isDuringNativeTransition.current) {
        lastNotNativeTransitionIndex.current = focusedIndex;
    }
    const children = routes
        .map((route, index) => ({ route, index }))
        .filter(({ route: { key } }) => (0, utils_1.shouldTabBeVisible)(descriptors[key].options))
        .map(({ route, index }) => {
        const descriptor = descriptors[route.key];
        // In case of native transition we want to keep the last focused index
        // Otherwise the lastNotNativeTransitionIndex is set to focusedIndex in the if above this statement
        const isFocused = index === focusedIndex;
        // TODO: Find a proper fix, that allows for proper JS navigation
        //lastNotNativeTransitionIndex.current;
        const title = descriptor.options.title ?? route.name;
        return (<react_native_screens_1.BottomTabsScreen key={route.key} {...descriptor.options} tabBarItemBadgeBackgroundColor={style?.badgeBackgroundColor} tabBarItemBadgeTextColor={style?.badgeTextColor} tabBarItemTitlePositionAdjustment={style?.titlePositionAdjustment} iconResourceName={descriptor.options.icon?.drawable} icon={convertOptionsIconToPropsIcon(descriptor.options.icon)} selectedIcon={convertOptionsIconToPropsIcon(descriptor.options.selectedIcon)} title={title} freezeContents={false} tabKey={route.key} isFocused={isFocused}>
          {descriptor.render()}
        </react_native_screens_1.BottomTabsScreen>);
    });
    // The native render is over, we can reset the flag
    isDuringNativeTransition.current = false;
    return (<BottomTabsWrapper tabBarItemTitleFontColor={style?.color} tabBarItemTitleFontFamily={style?.fontFamily} tabBarItemTitleFontSize={style?.fontSize} 
    // Only string values are accepted by screens
    tabBarItemTitleFontWeight={style?.fontWeight
            ? String(style.fontWeight)
            : undefined} tabBarItemTitleFontStyle={style?.fontStyle} tabBarBackgroundColor={style?.backgroundColor} tabBarBlurEffect={style?.blurEffect} tabBarTintColor={style?.tintColor} tabBarItemBadgeBackgroundColor={style?.badgeBackgroundColor} tabBarItemRippleColor={style?.rippleColor} tabBarItemLabelVisibilityMode={style?.labelVisibilityMode} tabBarItemIconColor={style?.iconColor} tabBarItemIconColorActive={style?.['&:active']?.iconColor ?? style?.tintColor} tabBarItemTitleFontColorActive={style?.['&:active']?.color ?? style?.tintColor} tabBarItemTitleFontSizeActive={style?.['&:active']?.fontSize} tabBarItemActiveIndicatorColor={style?.['&:active']?.indicatorColor} tabBarItemActiveIndicatorEnabled={!disableIndicator} tabBarMinimizeBehavior={minimizeBehavior} onNativeFocusChange={({ nativeEvent: { tabKey } }) => {
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
    </BottomTabsWrapper>);
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
const supportedTabBarMinimizeBehaviorsSet = new Set(types_1.SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS);
const supportedTabBarItemLabelVisibilityModesSet = new Set(types_1.SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES);
const supportedBlurEffectsSet = new Set(types_1.SUPPORTED_BLUR_EFFECTS);
function BottomTabsWrapper(props) {
    const { tabBarMinimizeBehavior, tabBarItemLabelVisibilityMode, tabBarBlurEffect, ...rest } = props;
    if (tabBarMinimizeBehavior && !supportedTabBarMinimizeBehaviorsSet.has(tabBarMinimizeBehavior)) {
        throw new Error(`Unsupported minimizeBehavior: ${tabBarMinimizeBehavior}. Supported values are: ${types_1.SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS.map((behavior) => `"${behavior}"`).join(', ')}`);
    }
    if (tabBarItemLabelVisibilityMode &&
        !supportedTabBarItemLabelVisibilityModesSet.has(tabBarItemLabelVisibilityMode)) {
        throw new Error(`Unsupported labelVisibilityMode: ${tabBarItemLabelVisibilityMode}. Supported values are: ${types_1.SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES.map((mode) => `"${mode}"`).join(', ')}`);
    }
    if (tabBarBlurEffect && !supportedBlurEffectsSet.has(tabBarBlurEffect)) {
        throw new Error(`Unsupported blurEffect: ${tabBarBlurEffect}. Supported values are: ${types_1.SUPPORTED_BLUR_EFFECTS.map((effect) => `"${effect}"`).join(', ')}`);
    }
    return (<react_native_screens_1.BottomTabs tabBarBlurEffect={tabBarBlurEffect} tabBarItemLabelVisibilityMode={tabBarItemLabelVisibilityMode} tabBarMinimizeBehavior={tabBarMinimizeBehavior} {...rest}/>);
}
//# sourceMappingURL=NativeTabsView.js.map