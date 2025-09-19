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
const appearance_1 = require("./appearance");
const types_1 = require("./types");
const utils_1 = require("./utils");
// We let native tabs to control the changes. This requires freeze to be disabled for tab bar.
// Otherwise user may see glitches when switching between tabs.
react_native_screens_1.featureFlags.experiment.controlledBottomTabs = false;
const supportedBlurEffectsSet = new Set(types_1.SUPPORTED_BLUR_EFFECTS);
function NativeTabsView(props) {
    const { builder, minimizeBehavior, disableIndicator, focusedIndex } = props;
    const { state, descriptors, navigation } = builder;
    const { routes } = state;
    let blurEffect = props.blurEffect;
    if (blurEffect && !supportedBlurEffectsSet.has(blurEffect)) {
        console.warn(`Unsupported blurEffect: ${blurEffect}. Supported values are: ${types_1.SUPPORTED_BLUR_EFFECTS.map((effect) => `"${effect}"`).join(', ')}`);
        blurEffect = undefined;
    }
    const deferredFocusedIndex = (0, react_1.useDeferredValue)(focusedIndex);
    let standardAppearance = (0, appearance_1.convertStyleToAppearance)({
        ...props.labelStyle,
        iconColor: props.iconColor,
        blurEffect,
        backgroundColor: props.backgroundColor,
        badgeBackgroundColor: props.badgeBackgroundColor,
    });
    if (props.tintColor) {
        standardAppearance = (0, appearance_1.appendSelectedStyleToAppearance)({ iconColor: props.tintColor, color: props.tintColor }, standardAppearance);
    }
    const scrollEdgeAppearance = (0, appearance_1.convertStyleToAppearance)({
        ...props.labelStyle,
        iconColor: props.iconColor,
        blurEffect,
        backgroundColor: props.backgroundColor,
        badgeBackgroundColor: props.badgeBackgroundColor,
    });
    const appearances = routes.map((route) => ({
        standardAppearance: (0, appearance_1.createStandardAppearanceFromOptions)(descriptors[route.key].options, standardAppearance),
        scrollEdgeAppearance: (0, appearance_1.createScrollEdgeAppearanceFromOptions)(descriptors[route.key].options, scrollEdgeAppearance),
    }));
    const options = routes.map((route) => descriptors[route.key].options);
    const children = routes
        .map((route, index) => ({ route, index }))
        .filter(({ route: { key } }) => (0, utils_1.shouldTabBeVisible)(descriptors[key].options))
        .map(({ route, index }) => {
        const descriptor = descriptors[route.key];
        const isFocused = index === deferredFocusedIndex;
        return (<Screen key={route.key} routeKey={route.key} name={route.name} descriptor={descriptor} isFocused={isFocused} standardAppearance={appearances[index].standardAppearance} scrollEdgeAppearance={appearances[index].scrollEdgeAppearance} badgeTextColor={props.badgeTextColor}/>);
    });
    return (<BottomTabsWrapper 
    // #region android props
    tabBarItemTitleFontColor={appearances[deferredFocusedIndex].standardAppearance.stacked?.normal
            ?.tabBarItemTitleFontColor} tabBarItemTitleFontFamily={appearances[deferredFocusedIndex].standardAppearance.stacked?.normal
            ?.tabBarItemTitleFontFamily} tabBarItemTitleFontSize={appearances[deferredFocusedIndex].standardAppearance.stacked?.normal
            ?.tabBarItemTitleFontSize} tabBarItemTitleFontSizeActive={appearances[deferredFocusedIndex].standardAppearance.stacked?.normal
            ?.tabBarItemTitleFontSize} tabBarItemTitleFontWeight={appearances[deferredFocusedIndex].standardAppearance.stacked?.normal
            ?.tabBarItemTitleFontWeight} tabBarItemTitleFontStyle={appearances[deferredFocusedIndex].standardAppearance.stacked?.normal
            ?.tabBarItemTitleFontStyle} tabBarItemIconColor={appearances[deferredFocusedIndex].standardAppearance.stacked?.normal?.tabBarItemIconColor} tabBarBackgroundColor={appearances[deferredFocusedIndex].standardAppearance.tabBarBackgroundColor ??
            props.backgroundColor ??
            undefined} tabBarItemRippleColor={props.rippleColor} tabBarItemLabelVisibilityMode={props.labelVisibilityMode} tabBarItemIconColorActive={appearances[deferredFocusedIndex].standardAppearance?.stacked?.selected
            ?.tabBarItemIconColor ?? props?.tintColor} tabBarItemTitleFontColorActive={appearances[deferredFocusedIndex].standardAppearance?.stacked?.selected
            ?.tabBarItemTitleFontColor ?? props?.tintColor} 
    // tabBarItemTitleFontSizeActive={activeStyle?.fontSize}
    tabBarItemActiveIndicatorColor={options[deferredFocusedIndex]?.indicatorColor ?? props?.indicatorColor} tabBarItemActiveIndicatorEnabled={!disableIndicator} 
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
    const { routeKey, name, descriptor, isFocused, standardAppearance, scrollEdgeAppearance, badgeTextColor, } = props;
    const role = descriptor.options.role;
    // To align with apple documentation and prevent untested cases,
    // title and icon cannot be changed when role is defined
    const shouldResetTitleAndIcon = !!role && process.env.EXPO_OS === 'ios';
    const title = descriptor.options.title ?? name;
    const icon = useAwaitedScreensIcon(descriptor.options.icon);
    const selectedIcon = useAwaitedScreensIcon(descriptor.options.selectedIcon);
    return (<react_native_screens_1.BottomTabsScreen {...descriptor.options} tabBarItemBadgeBackgroundColor={standardAppearance.stacked?.normal?.tabBarItemBadgeBackgroundColor} tabBarItemBadgeTextColor={badgeTextColor} standardAppearance={standardAppearance} scrollEdgeAppearance={scrollEdgeAppearance} iconResourceName={getAndroidIconResourceName(icon)} iconResource={getAndroidIconResource(icon)} icon={shouldResetTitleAndIcon ? undefined : convertOptionsIconToPropsIcon(icon)} selectedIcon={shouldResetTitleAndIcon ? undefined : convertOptionsIconToPropsIcon(selectedIcon)} title={shouldResetTitleAndIcon ? undefined : title} freezeContents={false} tabKey={routeKey} systemItem={descriptor.options.role} isFocused={isFocused}>
      {descriptor.render()}
    </react_native_screens_1.BottomTabsScreen>);
}
function useAwaitedScreensIcon(icon) {
    const src = icon && typeof icon === 'object' && 'src' in icon ? icon.src : undefined;
    const [awaitedIcon, setAwaitedIcon] = (0, react_1.useState)(undefined);
    (0, react_1.useEffect)(() => {
        const loadIcon = async () => {
            if (src && src instanceof Promise) {
                const awaitedSrc = await src;
                if (awaitedSrc) {
                    const currentAwaitedIcon = { src: awaitedSrc };
                    setAwaitedIcon(currentAwaitedIcon);
                }
            }
        };
        loadIcon();
        // Checking `src` rather then icon here, to avoid unnecessary re-renders
        // The icon object can be recreated, while src should stay the same
        // In this case as we control `VectorIcon`, it will only change if `family` or `name` props change
        // So we should be safe with promise resolving
    }, [src]);
    return (0, react_1.useMemo)(() => (isAwaitedIcon(icon) ? icon : awaitedIcon), [awaitedIcon, icon]);
}
function isAwaitedIcon(icon) {
    return !icon || !('src' in icon && icon.src instanceof Promise);
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
function getAndroidIconResource(icon) {
    if (icon && 'src' in icon && icon.src) {
        return icon.src;
    }
    return undefined;
}
function getAndroidIconResourceName(icon) {
    if (icon && 'drawable' in icon && icon.drawable) {
        return icon.drawable;
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