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
exports.DrawerView = DrawerView;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_drawer_layout_1 = require("react-native-drawer-layout");
const useLatestCallback_1 = __importDefault(require("../../../utils/useLatestCallback"));
const native_1 = require("../../native");
const DrawerContent_1 = require("./DrawerContent");
const DrawerToggleButton_1 = require("./DrawerToggleButton");
const ScreenFallback_1 = require("./ScreenFallback");
const elements_1 = require("../../elements");
const DrawerPositionContext_1 = require("../utils/DrawerPositionContext");
const DrawerStatusContext_1 = require("../utils/DrawerStatusContext");
const addCancelListener_1 = require("../utils/addCancelListener");
const getDrawerStatusFromState_1 = require("../utils/getDrawerStatusFromState");
const DRAWER_BORDER_RADIUS = 16;
const renderDrawerContentDefault = (props) => (<DrawerContent_1.DrawerContent {...props}/>);
function DrawerViewBase({ state, navigation, descriptors, defaultStatus, drawerContent = renderDrawerContentDefault, detachInactiveScreens = react_native_1.Platform.OS === 'web' ||
    react_native_1.Platform.OS === 'android' ||
    react_native_1.Platform.OS === 'ios', }) {
    const { direction } = (0, native_1.useLocale)();
    const focusedRouteKey = state.routes[state.index].key;
    const { drawerHideStatusBarOnOpen, drawerPosition = direction === 'rtl' ? 'right' : 'left', drawerStatusBarAnimation, drawerStyle, drawerType = react_native_1.Platform.select({ ios: 'slide', default: 'front' }), configureGestureHandler, keyboardDismissMode, overlayColor = 'rgba(0, 0, 0, 0.5)', swipeEdgeWidth, swipeEnabled = react_native_1.Platform.OS !== 'web' && react_native_1.Platform.OS !== 'windows' && react_native_1.Platform.OS !== 'macos', swipeMinDistance, overlayAccessibilityLabel, } = descriptors[focusedRouteKey].options;
    const [loaded, setLoaded] = React.useState([focusedRouteKey]);
    if (!loaded.includes(focusedRouteKey)) {
        setLoaded([...loaded, focusedRouteKey]);
    }
    const previousRouteKeyRef = React.useRef(focusedRouteKey);
    React.useEffect(() => {
        const previousRouteKey = previousRouteKeyRef.current;
        if (previousRouteKey !== focusedRouteKey &&
            descriptors[previousRouteKey]?.options.popToTopOnBlur) {
            const prevRoute = state.routes.find((route) => route.key === previousRouteKey);
            if (prevRoute?.state?.type === 'stack' && prevRoute.state.key) {
                navigation.dispatch({
                    ...native_1.StackActions.popToTop(),
                    target: prevRoute.state.key,
                });
            }
        }
        previousRouteKeyRef.current = focusedRouteKey;
    }, [descriptors, focusedRouteKey, navigation, state.routes]);
    const dimensions = (0, elements_1.useFrameSize)((size) => size, true);
    const { colors } = (0, native_1.useTheme)();
    const drawerStatus = (0, getDrawerStatusFromState_1.getDrawerStatusFromState)(state);
    const handleDrawerOpen = (0, useLatestCallback_1.default)(() => {
        navigation.dispatch({
            ...native_1.DrawerActions.openDrawer(),
            target: state.key,
        });
    });
    const handleDrawerClose = (0, useLatestCallback_1.default)(() => {
        navigation.dispatch({
            ...native_1.DrawerActions.closeDrawer(),
            target: state.key,
        });
    });
    const handleGestureStart = (0, useLatestCallback_1.default)(() => {
        navigation.emit({
            type: 'gestureStart',
            target: state.key,
        });
    });
    const handleGestureEnd = (0, useLatestCallback_1.default)(() => {
        navigation.emit({
            type: 'gestureEnd',
            target: state.key,
        });
    });
    const handleGestureCancel = (0, useLatestCallback_1.default)(() => {
        navigation.emit({
            type: 'gestureCancel',
            target: state.key,
        });
    });
    const handleTransitionStart = (0, useLatestCallback_1.default)((closing) => {
        navigation.emit({
            type: 'transitionStart',
            data: { closing },
            target: state.key,
        });
    });
    const handleTransitionEnd = (0, useLatestCallback_1.default)((closing) => {
        navigation.emit({
            type: 'transitionEnd',
            data: { closing },
            target: state.key,
        });
    });
    React.useEffect(() => {
        if (drawerStatus === defaultStatus || drawerType === 'permanent') {
            return;
        }
        const handleHardwareBack = () => {
            // We shouldn't handle the back button if the parent screen isn't focused
            // This will avoid the drawer overriding event listeners from a focused screen
            if (!navigation.isFocused()) {
                return false;
            }
            if (defaultStatus === 'open') {
                handleDrawerOpen();
            }
            else {
                handleDrawerClose();
            }
            return true;
        };
        // We only add the listeners when drawer opens
        // This way we can make sure that the listener is added as late as possible
        // This will make sure that our handler will run first when back button is pressed
        return (0, addCancelListener_1.addCancelListener)(handleHardwareBack);
    }, [defaultStatus, drawerStatus, drawerType, handleDrawerClose, handleDrawerOpen, navigation]);
    const renderDrawerContent = () => {
        return (<DrawerPositionContext_1.DrawerPositionContext.Provider value={drawerPosition}>
        {drawerContent({
                state,
                navigation,
                descriptors,
            })}
      </DrawerPositionContext_1.DrawerPositionContext.Provider>);
    };
    const renderSceneContent = () => {
        return (<ScreenFallback_1.MaybeScreenContainer enabled={detachInactiveScreens} hasTwoStates style={styles.content}>
        {state.routes.map((route, index) => {
                const descriptor = descriptors[route.key];
                const { lazy = true } = descriptor.options;
                const isFocused = state.index === index;
                const isPreloaded = state.preloadedRouteKeys.includes(route.key);
                if (lazy && !loaded.includes(route.key) && !isFocused && !isPreloaded) {
                    // Don't render a lazy screen if we've never navigated to it or it wasn't preloaded
                    return null;
                }
                const { freezeOnBlur, header = ({ layout, options }) => (<elements_1.Header {...options} layout={layout} title={(0, elements_1.getHeaderTitle)(options, route.name)} headerLeft={drawerPosition === 'left' && options.headerLeft == null
                        ? (props) => <DrawerToggleButton_1.DrawerToggleButton {...props}/>
                        : options.headerLeft} headerRight={drawerPosition === 'right' && options.headerRight == null
                        ? (props) => <DrawerToggleButton_1.DrawerToggleButton {...props}/>
                        : options.headerRight}/>), headerShown, headerStatusBarHeight, headerTransparent, sceneStyle, } = descriptor.options;
                return (<ScreenFallback_1.MaybeScreen key={route.key} style={[react_native_1.StyleSheet.absoluteFill, { zIndex: isFocused ? 0 : -1 }]} visible={isFocused} enabled={detachInactiveScreens} freezeOnBlur={freezeOnBlur} shouldFreeze={!isFocused && !isPreloaded}>
              <elements_1.Screen focused={isFocused} route={descriptor.route} navigation={descriptor.navigation} headerShown={headerShown} headerStatusBarHeight={headerStatusBarHeight} headerTransparent={headerTransparent} header={header({
                        layout: dimensions,
                        route: descriptor.route,
                        navigation: descriptor.navigation,
                        options: descriptor.options,
                    })} style={sceneStyle}>
                {descriptor.render()}
              </elements_1.Screen>
            </ScreenFallback_1.MaybeScreen>);
            })}
      </ScreenFallback_1.MaybeScreenContainer>);
    };
    return (<DrawerStatusContext_1.DrawerStatusContext.Provider value={drawerStatus}>
      <react_native_drawer_layout_1.Drawer open={drawerStatus !== 'closed'} onOpen={handleDrawerOpen} onClose={handleDrawerClose} onGestureStart={handleGestureStart} onGestureEnd={handleGestureEnd} onGestureCancel={handleGestureCancel} onTransitionStart={handleTransitionStart} onTransitionEnd={handleTransitionEnd} layout={dimensions} direction={direction} configureGestureHandler={configureGestureHandler} swipeEnabled={swipeEnabled} swipeEdgeWidth={swipeEdgeWidth} swipeMinDistance={swipeMinDistance} hideStatusBarOnOpen={drawerHideStatusBarOnOpen} statusBarAnimation={drawerStatusBarAnimation} keyboardDismissMode={keyboardDismissMode} drawerType={drawerType} overlayAccessibilityLabel={overlayAccessibilityLabel} drawerPosition={drawerPosition} drawerStyle={[
            { backgroundColor: colors.card },
            drawerType === 'permanent' &&
                ((react_native_1.Platform.OS === 'web'
                    ? drawerPosition === 'right'
                    : (direction === 'rtl' && drawerPosition !== 'right') ||
                        (direction !== 'rtl' && drawerPosition === 'right'))
                    ? {
                        borderLeftColor: colors.border,
                        borderLeftWidth: react_native_1.StyleSheet.hairlineWidth,
                    }
                    : {
                        borderRightColor: colors.border,
                        borderRightWidth: react_native_1.StyleSheet.hairlineWidth,
                    }),
            drawerType === 'front' &&
                (drawerPosition === 'left'
                    ? {
                        borderTopRightRadius: DRAWER_BORDER_RADIUS,
                        borderBottomRightRadius: DRAWER_BORDER_RADIUS,
                    }
                    : {
                        borderTopLeftRadius: DRAWER_BORDER_RADIUS,
                        borderBottomLeftRadius: DRAWER_BORDER_RADIUS,
                    }),
            drawerStyle,
        ]} overlayStyle={{ backgroundColor: overlayColor }} renderDrawerContent={renderDrawerContent}>
        {renderSceneContent()}
      </react_native_drawer_layout_1.Drawer>
    </DrawerStatusContext_1.DrawerStatusContext.Provider>);
}
function DrawerView({ navigation, ...rest }) {
    return (<elements_1.SafeAreaProviderCompat>
      <DrawerViewBase navigation={navigation} {...rest}/>
    </elements_1.SafeAreaProviderCompat>);
}
const styles = react_native_1.StyleSheet.create({
    content: {
        flex: 1,
    },
});
//# sourceMappingURL=DrawerView.js.map