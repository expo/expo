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
const native_1 = require("@react-navigation/native");
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_screens_1 = require("react-native-screens");
const appearance_1 = require("./appearance");
const types_1 = require("./types");
const icon_1 = require("./utils/icon");
// We let native tabs to control the changes. This requires freeze to be disabled for tab bar.
// Otherwise user may see glitches when switching between tabs.
react_native_screens_1.featureFlags.experiment.controlledBottomTabs = false;
function NativeTabsView(props) {
    const { minimizeBehavior, disableIndicator, focusedIndex, tabs, sidebarAdaptable } = props;
    const deferredFocusedIndex = (0, react_1.useDeferredValue)(focusedIndex);
    // We need to check if the deferred index is not out of bounds
    // This can happen when the focused index is the last tab, and user removes that tab
    // In that case the deferred index will still point to the last tab, but after re-render
    // it will be out of bounds
    const inBoundsDeferredFocusedIndex = deferredFocusedIndex < tabs.length ? deferredFocusedIndex : focusedIndex;
    const appearances = tabs.map((tab) => ({
        standardAppearance: (0, appearance_1.createStandardAppearanceFromOptions)(tab.options),
        scrollEdgeAppearance: (0, appearance_1.createScrollEdgeAppearanceFromOptions)(tab.options),
    }));
    const options = tabs.map((tab) => tab.options);
    const children = tabs.map((tab, index) => {
        const isFocused = index === inBoundsDeferredFocusedIndex;
        return (<Screen key={tab.routeKey} routeKey={tab.routeKey} name={tab.name} options={tab.options} isFocused={isFocused} standardAppearance={appearances[index].standardAppearance} scrollEdgeAppearance={appearances[index].scrollEdgeAppearance} badgeTextColor={tab.options.badgeTextColor} contentRenderer={tab.contentRenderer}/>);
    });
    const currentTabAppearance = appearances[inBoundsDeferredFocusedIndex]?.standardAppearance;
    const tabBarControllerMode = sidebarAdaptable
        ? 'tabSidebar'
        : sidebarAdaptable === false
            ? 'tabBar'
            : 'automatic';
    return (<BottomTabsWrapper 
    // #region android props
    tabBarItemTitleFontColor={currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontColor} tabBarItemTitleFontFamily={currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontFamily} tabBarItemTitleFontSize={currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontSize} tabBarItemTitleFontSizeActive={currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontSize} tabBarItemTitleFontWeight={currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontWeight} tabBarItemTitleFontStyle={currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontStyle} tabBarItemIconColor={currentTabAppearance?.stacked?.normal?.tabBarItemIconColor} tabBarBackgroundColor={currentTabAppearance?.tabBarBackgroundColor} tabBarItemRippleColor={props.rippleColor} tabBarItemLabelVisibilityMode={props.labelVisibilityMode} tabBarItemIconColorActive={currentTabAppearance?.stacked?.selected?.tabBarItemIconColor ?? props?.tintColor} tabBarItemTitleFontColorActive={currentTabAppearance?.stacked?.selected?.tabBarItemTitleFontColor ?? props?.tintColor} 
    // tabBarItemTitleFontSizeActive={activeStyle?.fontSize}
    tabBarItemActiveIndicatorColor={options[inBoundsDeferredFocusedIndex]?.indicatorColor} tabBarItemActiveIndicatorEnabled={!disableIndicator} 
    // #endregion
    // #region iOS props
    tabBarTintColor={props?.tintColor} tabBarMinimizeBehavior={minimizeBehavior} tabBarControllerMode={tabBarControllerMode} 
    // #endregion
    onNativeFocusChange={({ nativeEvent: { tabKey } }) => {
            props.onTabChange(tabKey);
        }}>
      {children}
    </BottomTabsWrapper>);
}
function Screen(props) {
    const { routeKey, name, options, isFocused, standardAppearance, scrollEdgeAppearance, badgeTextColor, contentRenderer, } = props;
    const title = options.title ?? name;
    // We need to await the icon, as VectorIcon will load asynchronously
    const icon = (0, icon_1.useAwaitedScreensIcon)(options.icon);
    const selectedIcon = (0, icon_1.useAwaitedScreensIcon)(options.selectedIcon);
    const { colors } = (0, native_1.useTheme)();
    return (<react_native_screens_1.BottomTabsScreen {...options} tabBarItemBadgeBackgroundColor={standardAppearance.stacked?.normal?.tabBarItemBadgeBackgroundColor} tabBarItemBadgeTextColor={badgeTextColor} standardAppearance={standardAppearance} scrollEdgeAppearance={scrollEdgeAppearance} icon={(0, icon_1.convertOptionsIconToRNScreensPropsIcon)(icon)} selectedIcon={(0, icon_1.convertOptionsIconToIOSPropsIcon)(selectedIcon)} title={title} freezeContents={false} systemItem={options.role} {...options.nativeProps} tabKey={routeKey} isFocused={isFocused}>
      <react_native_1.View 
    // https://github.com/software-mansion/react-native-screens/issues/2662#issuecomment-2757735088
    collapsable={false} style={[
            { backgroundColor: colors.background },
            options.contentStyle,
            { flex: 1, position: 'relative', overflow: 'hidden' },
        ]}>
        {contentRenderer()}
      </react_native_1.View>
    </react_native_screens_1.BottomTabsScreen>);
}
const supportedTabBarMinimizeBehaviorsSet = new Set(types_1.SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS);
const supportedTabBarItemLabelVisibilityModesSet = new Set(types_1.SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES);
function BottomTabsWrapper(props) {
    let { tabBarMinimizeBehavior, tabBarItemLabelVisibilityMode, ...rest } = props;
    if (tabBarMinimizeBehavior && !supportedTabBarMinimizeBehaviorsSet.has(tabBarMinimizeBehavior)) {
        console.warn(`Unsupported minimizeBehavior: ${tabBarMinimizeBehavior}. Supported values are: ${types_1.SUPPORTED_TAB_BAR_MINIMIZE_BEHAVIORS.map((behavior) => `"${behavior}"`).join(', ')}`);
        tabBarMinimizeBehavior = undefined;
    }
    if (tabBarItemLabelVisibilityMode &&
        !supportedTabBarItemLabelVisibilityModesSet.has(tabBarItemLabelVisibilityMode)) {
        console.warn(`Unsupported labelVisibilityMode: ${tabBarItemLabelVisibilityMode}. Supported values are: ${types_1.SUPPORTED_TAB_BAR_ITEM_LABEL_VISIBILITY_MODES.map((mode) => `"${mode}"`).join(', ')}`);
        tabBarItemLabelVisibilityMode = undefined;
    }
    return (<react_native_screens_1.BottomTabs tabBarItemLabelVisibilityMode={tabBarItemLabelVisibilityMode} tabBarMinimizeBehavior={tabBarMinimizeBehavior} {...rest}/>);
}
//# sourceMappingURL=NativeTabsView.js.map