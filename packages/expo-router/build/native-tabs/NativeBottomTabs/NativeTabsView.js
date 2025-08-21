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
    const { builder, minimizeBehavior, disableIndicator, focusedIndex, scrollEdgeAppearanceProps } = props;
    const { state, descriptors, navigation } = builder;
    const { routes } = state;
    const deferredFocusedIndex = (0, react_1.useDeferredValue)(focusedIndex);
    let standardAppearance = convertStyleToAppearance({
        ...props.labelStyle,
        iconColor: (0, utils_1.getValueFromTypeOrRecord)(props.iconColor, 'standard'),
        blurEffect: props.blurEffect,
        backgroundColor: props.backgroundColor,
        badgeBackgroundColor: (0, utils_1.getValueFromTypeOrRecord)(props.badgeBackgroundColor, 'standard'),
    });
    if (props.tintColor) {
        standardAppearance = appendSelectedStyleToAppearance({ iconColor: props.tintColor, color: props.tintColor }, standardAppearance);
    }
    const scrollEdgeAppearance = convertStyleToAppearance({
        ...props.scrollEdgeAppearanceProps?.ios26LabelStyle,
        iconColor: (0, utils_1.getValueFromTypeOrRecord)(scrollEdgeAppearanceProps?.ios26IconColor, 'standard'),
        blurEffect: scrollEdgeAppearanceProps?.blurEffect,
        backgroundColor: scrollEdgeAppearanceProps?.backgroundColor,
        badgeBackgroundColor: (0, utils_1.getValueFromTypeOrRecord)(scrollEdgeAppearanceProps?.ios26BadgeBackgroundColor, 'standard'),
    });
    const children = routes
        .map((route, index) => ({ route, index }))
        .filter(({ route: { key } }) => (0, utils_1.shouldTabBeVisible)(descriptors[key].options))
        .map(({ route, index }) => {
        const descriptor = descriptors[route.key];
        const isFocused = index === deferredFocusedIndex;
        return (<Screen key={route.key} routeKey={route.key} name={route.name} descriptor={descriptor} isFocused={isFocused} baseStandardAppearance={standardAppearance} baseScrollEdgeAppearance={scrollEdgeAppearance} badgeTextColor={props.badgeTextColor}/>);
    });
    return (<BottomTabsWrapper 
    // #region android props
    tabBarItemTitleFontColor={standardAppearance.stacked?.normal?.tabBarItemTitleFontColor} tabBarItemTitleFontFamily={standardAppearance.stacked?.normal?.tabBarItemTitleFontFamily} tabBarItemTitleFontSize={standardAppearance.stacked?.normal?.tabBarItemTitleFontSize} tabBarItemTitleFontWeight={standardAppearance.stacked?.normal?.tabBarItemTitleFontWeight} tabBarItemTitleFontStyle={standardAppearance.stacked?.normal?.tabBarItemTitleFontStyle} tabBarItemIconColor={standardAppearance.stacked?.normal?.tabBarItemIconColor} tabBarBackgroundColor={props.backgroundColor ?? undefined} tabBarItemRippleColor={props.rippleColor} tabBarItemLabelVisibilityMode={props.labelVisibilityMode} 
    // TODO (android): Use values of selected appearance of focused tab
    tabBarItemIconColorActive={props?.tintColor} tabBarItemTitleFontColorActive={props?.tintColor} 
    // tabBarItemTitleFontSizeActive={activeStyle?.fontSize}
    // tabBarItemActiveIndicatorColor={activeStyle?.indicatorColor}
    tabBarItemActiveIndicatorEnabled={!disableIndicator} 
    // #endregion
    // #region iOS props
    tabBarTintColor={props?.tintColor} tabBarMinimizeBehavior={minimizeBehavior} 
    // #endregion
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
    </BottomTabsWrapper>);
}
function Screen(props) {
    const { routeKey, name, descriptor, isFocused, baseStandardAppearance, baseScrollEdgeAppearance, badgeTextColor, } = props;
    const title = descriptor.options.title ?? name;
    const standardAppearance = appendSelectedStyleToAppearance({
        ...(descriptor.options.selectedLabelStyle ?? {}),
        iconColor: (0, utils_1.getValueFromTypeOrRecord)(descriptor.options.selectedIconColor, 'standard'),
        backgroundColor: (0, utils_1.getValueFromTypeOrRecord)(descriptor.options.selectedBackgroundColor, 'standard'),
        badgeBackgroundColor: (0, utils_1.getValueFromTypeOrRecord)(descriptor.options.selectedBadgeBackgroundColor, 'standard'),
        titlePositionAdjustment: (0, utils_1.getValueFromTypeOrRecord)(descriptor.options.selectedTitlePositionAdjustment, 'standard'),
    }, baseStandardAppearance);
    const scrollEdgeAppearance = appendSelectedStyleToAppearance({
        ...(descriptor.options.selectedLabelStyle ?? {}),
        iconColor: (0, utils_1.getValueFromTypeOrRecord)(descriptor.options.selectedIconColor, 'scrollEdge'),
        badgeBackgroundColor: (0, utils_1.getValueFromTypeOrRecord)(descriptor.options.selectedBadgeBackgroundColor, 'scrollEdge'),
        titlePositionAdjustment: (0, utils_1.getValueFromTypeOrRecord)(descriptor.options.selectedTitlePositionAdjustment, 'scrollEdge'),
    }, baseScrollEdgeAppearance);
    let icon = convertOptionsIconToPropsIcon(descriptor.options.icon);
    // Fix for an issue in screens
    if (descriptor.options.role) {
        switch (descriptor.options.role) {
            case 'search':
                icon = { sfSymbolName: 'magnifyingglass' };
        }
    }
    return (<react_native_screens_1.BottomTabsScreen {...descriptor.options} tabBarItemBadgeBackgroundColor={standardAppearance.stacked?.normal?.tabBarItemBadgeBackgroundColor} tabBarItemBadgeTextColor={badgeTextColor} standardAppearance={standardAppearance} scrollEdgeAppearance={scrollEdgeAppearance} iconResourceName={descriptor.options.icon?.drawable} icon={icon} selectedIcon={convertOptionsIconToPropsIcon(descriptor.options.selectedIcon)} title={title} freezeContents={false} tabKey={routeKey} systemItem={descriptor.options.role} isFocused={isFocused}>
      {descriptor.render()}
    </react_native_screens_1.BottomTabsScreen>);
}
function appendSelectedStyleToAppearance(selectedStyle, appearance) {
    let tabBarBlurEffect = selectedStyle?.blurEffect;
    if (tabBarBlurEffect && !supportedBlurEffectsSet.has(tabBarBlurEffect)) {
        console.warn(`Unsupported blurEffect: ${tabBarBlurEffect}. Supported values are: ${types_1.SUPPORTED_BLUR_EFFECTS.map((effect) => `"${effect}"`).join(', ')}`);
        tabBarBlurEffect = undefined;
    }
    const baseItemAppearance = appearance.stacked || appearance.inline || appearance.compactInline || {};
    const selectedAppearance = {
        ...baseItemAppearance.normal,
        ...baseItemAppearance.selected,
        ...convertStyleToItemStateAppearance(selectedStyle),
    };
    const itemAppearance = {
        ...baseItemAppearance,
        selected: selectedAppearance,
        focused: selectedAppearance,
    };
    return {
        stacked: itemAppearance,
        inline: itemAppearance,
        compactInline: itemAppearance,
        tabBarBackgroundColor: selectedStyle.backgroundColor === null
            ? undefined
            : (selectedStyle.backgroundColor ?? appearance.tabBarBackgroundColor),
        tabBarBlurEffect: tabBarBlurEffect ?? appearance.tabBarBlurEffect,
    };
}
const supportedBlurEffectsSet = new Set(types_1.SUPPORTED_BLUR_EFFECTS);
function convertStyleToAppearance(style) {
    if (!style) {
        return {};
    }
    let blurEffect = style.blurEffect;
    if (style.blurEffect && !supportedBlurEffectsSet.has(style.blurEffect)) {
        console.warn(`Unsupported blurEffect: ${style.blurEffect}. Supported values are: ${types_1.SUPPORTED_BLUR_EFFECTS.map((effect) => `"${effect}"`).join(', ')}`);
        blurEffect = undefined;
    }
    const stateAppearance = convertStyleToItemStateAppearance(style);
    const itemAppearance = {
        normal: stateAppearance,
        selected: stateAppearance,
        focused: stateAppearance,
        disabled: {},
    };
    return {
        inline: itemAppearance,
        stacked: itemAppearance,
        compactInline: itemAppearance,
        tabBarBackgroundColor: style?.backgroundColor ?? undefined,
        tabBarBlurEffect: blurEffect,
    };
}
function convertStyleToItemStateAppearance(style) {
    if (!style) {
        return {};
    }
    const stateAppearance = {
        tabBarItemBadgeBackgroundColor: style.badgeBackgroundColor,
        tabBarItemTitlePositionAdjustment: style.titlePositionAdjustment,
        tabBarItemIconColor: style.iconColor,
        tabBarItemTitleFontFamily: style.fontFamily,
        tabBarItemTitleFontSize: style.fontSize,
        // Only string values are accepted by rn-screens
        tabBarItemTitleFontWeight: style?.fontWeight
            ? String(style.fontWeight)
            : undefined,
        tabBarItemTitleFontStyle: style.fontStyle,
        tabBarItemTitleFontColor: style.color,
    };
    Object.keys(stateAppearance).forEach((key) => {
        if (stateAppearance[key] === undefined) {
            delete stateAppearance[key];
        }
    });
    return stateAppearance;
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