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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabsView = NativeTabsView;
const react_1 = __importStar(require("react"));
const react_native_screens_1 = require("react-native-screens");
const package_json_1 = __importDefault(require("react-native-screens/package.json"));
const appearance_1 = require("./appearance");
const types_1 = require("./types");
const utils_1 = require("./utils");
// We let native tabs to control the changes. This requires freeze to be disabled for tab bar.
// Otherwise user may see glitches when switching between tabs.
react_native_screens_1.featureFlags.experiment.controlledBottomTabs = false;
const supportedBlurEffectsSet = new Set(types_1.SUPPORTED_BLUR_EFFECTS);
// TODO(ubax): refactor this component, so that testing options passed to screen is easier
function NativeTabsView(props) {
    const { builder, minimizeBehavior, disableIndicator, focusedIndex } = props;
    const { state, descriptors, navigation } = builder;
    const { routes } = state;
    let blurEffect = props.blurEffect;
    if (blurEffect && !supportedBlurEffectsSet.has(blurEffect)) {
        console.warn(`Unsupported blurEffect: ${blurEffect}. Supported values are: ${types_1.SUPPORTED_BLUR_EFFECTS.map((effect) => `"${effect}"`).join(', ')}`);
        blurEffect = undefined;
    }
    const defaultIconColor = (0, utils_1.convertIconColorPropToObject)(props.iconColor).default;
    const defaultLabelStyle = (0, utils_1.convertLabelStylePropToObject)(props.labelStyle).default;
    const deferredFocusedIndex = (0, react_1.useDeferredValue)(focusedIndex);
    // We need to check if the deferred index is not out of bounds
    // This can happen when the focused index is the last tab, and user removes that tab
    // In that case the deferred index will still point to the last tab, but after re-render
    // it will be out of bounds
    const inBoundsDeferredFocusedIndex = deferredFocusedIndex < routes.length ? deferredFocusedIndex : focusedIndex;
    let standardAppearance = (0, appearance_1.convertStyleToAppearance)({
        ...defaultLabelStyle,
        iconColor: defaultIconColor,
        blurEffect,
        backgroundColor: props.backgroundColor,
        badgeBackgroundColor: props.badgeBackgroundColor,
    });
    if (props.tintColor) {
        standardAppearance = (0, appearance_1.appendSelectedStyleToAppearance)({ iconColor: props.tintColor, color: props.tintColor }, standardAppearance);
    }
    const scrollEdgeAppearance = (0, appearance_1.convertStyleToAppearance)({
        ...defaultLabelStyle,
        iconColor: defaultIconColor,
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
        const isFocused = index === inBoundsDeferredFocusedIndex;
        return (<Screen key={route.key} routeKey={route.key} name={route.name} descriptor={descriptor} isFocused={isFocused} standardAppearance={appearances[index].standardAppearance} scrollEdgeAppearance={appearances[index].scrollEdgeAppearance} badgeTextColor={props.badgeTextColor}/>);
    });
    const currentTabAppearance = appearances[inBoundsDeferredFocusedIndex]?.standardAppearance;
    return (<BottomTabsWrapper 
    // #region android props
    tabBarItemTitleFontColor={currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontColor} tabBarItemTitleFontFamily={currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontFamily} tabBarItemTitleFontSize={currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontSize} tabBarItemTitleFontSizeActive={currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontSize} tabBarItemTitleFontWeight={currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontWeight} tabBarItemTitleFontStyle={currentTabAppearance?.stacked?.normal?.tabBarItemTitleFontStyle} tabBarItemIconColor={currentTabAppearance?.stacked?.normal?.tabBarItemIconColor} tabBarBackgroundColor={currentTabAppearance?.tabBarBackgroundColor ?? props.backgroundColor ?? undefined} tabBarItemRippleColor={props.rippleColor} tabBarItemLabelVisibilityMode={props.labelVisibilityMode} tabBarItemIconColorActive={currentTabAppearance?.stacked?.selected?.tabBarItemIconColor ?? props?.tintColor} tabBarItemTitleFontColorActive={currentTabAppearance?.stacked?.selected?.tabBarItemTitleFontColor ?? props?.tintColor} 
    // tabBarItemTitleFontSizeActive={activeStyle?.fontSize}
    tabBarItemActiveIndicatorColor={options[inBoundsDeferredFocusedIndex]?.indicatorColor ?? props?.indicatorColor} tabBarItemActiveIndicatorEnabled={!disableIndicator} 
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
    const title = descriptor.options.title ?? name;
    const icon = useAwaitedScreensIcon(descriptor.options.icon);
    const selectedIcon = useAwaitedScreensIcon(descriptor.options.selectedIcon);
    return (<react_native_screens_1.BottomTabsScreen {...descriptor.options} tabBarItemBadgeBackgroundColor={standardAppearance.stacked?.normal?.tabBarItemBadgeBackgroundColor} tabBarItemBadgeTextColor={badgeTextColor} standardAppearance={standardAppearance} scrollEdgeAppearance={scrollEdgeAppearance} iconResourceName={getAndroidIconResourceName(icon)} iconResource={getAndroidIconResource(icon)} icon={convertOptionsIconToPropsIcon(icon)} selectedIcon={convertOptionsIconToPropsIcon(selectedIcon)} title={title} freezeContents={false} tabKey={routeKey} systemItem={descriptor.options.role} isFocused={isFocused}>
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
function convertOptionsIconToPropsIcon_4_16(icon) {
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
// Function added in https://github.com/expo/expo/pull/41631
// to support native tabs icons in both 4.16 and 4.18+ versions of react-native-screens
function convertOptionsIconToPropsIcon_4_18(icon) {
    if (!icon) {
        return undefined;
    }
    if (process.env.EXPO_OS === 'ios') {
        if ('sf' in icon && icon.sf) {
            return {
                // selectedIcon
                type: 'sfSymbol',
                name: icon.sf,
                // icon
                ios: {
                    type: 'sfSymbol',
                    name: icon.sf,
                },
            };
        }
        if ('src' in icon && icon.src) {
            return {
                // selectedIcon
                type: 'templateSource',
                templateSource: icon.src,
                // icon
                ios: {
                    type: 'templateSource',
                    templateSource: icon.src,
                },
            };
        }
    }
    else if (process.env.EXPO_OS === 'android') {
        if ('drawable' in icon && icon.drawable) {
            return {
                android: {
                    type: 'drawableResource',
                    name: icon.drawable,
                },
            };
        }
        if ('src' in icon && icon.src) {
            return {
                android: {
                    type: 'imageSource',
                    imageSource: icon.src,
                },
            };
        }
    }
    return undefined;
}
function convertOptionsIconToPropsIcon(icon) {
    // Code added in https://github.com/expo/expo/pull/41631
    // to support native tabs icons in both 4.16 and 4.18+ versions of react-native-screens
    const [_, minor] = package_json_1.default.version.split('.');
    const is4_18rNewer = minor && parseInt(minor, 10) >= 18;
    if (is4_18rNewer) {
        return convertOptionsIconToPropsIcon_4_18(icon);
    }
    return convertOptionsIconToPropsIcon_4_16(icon);
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
// #endregion
//# sourceMappingURL=NativeTabsView.js.map