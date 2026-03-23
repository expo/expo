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
exports.NativeStackView = NativeStackView;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const elements_1 = require("../../elements");
const native_1 = require("../../native");
const useAnimatedHeaderHeight_1 = require("../utils/useAnimatedHeaderHeight");
const TRANSPARENT_PRESENTATIONS = ['transparentModal', 'containedTransparentModal'];
function NativeStackView({ state, descriptors, describe }) {
    const parentHeaderBack = React.useContext(elements_1.HeaderBackContext);
    const { buildHref } = (0, native_1.useLinkBuilder)();
    const preloadedDescriptors = state.preloadedRoutes.reduce((acc, route) => {
        acc[route.key] = acc[route.key] || describe(route, true);
        return acc;
    }, {});
    return (<elements_1.SafeAreaProviderCompat>
      {state.routes.concat(state.preloadedRoutes).map((route, i) => {
            const isFocused = state.index === i;
            const previousKey = state.routes[i - 1]?.key;
            const nextKey = state.routes[i + 1]?.key;
            const previousDescriptor = previousKey ? descriptors[previousKey] : undefined;
            const nextDescriptor = nextKey ? descriptors[nextKey] : undefined;
            const { options, navigation, render } = descriptors[route.key] ?? preloadedDescriptors[route.key];
            const headerBack = previousDescriptor
                ? {
                    title: (0, elements_1.getHeaderTitle)(previousDescriptor.options, previousDescriptor.route.name),
                    href: buildHref(previousDescriptor.route.name, previousDescriptor.route.params),
                }
                : parentHeaderBack;
            const canGoBack = headerBack != null;
            const { header, headerShown, headerBackIcon, headerBackImageSource, headerLeft, headerTransparent, headerBackTitle, presentation, contentStyle, ...rest } = options;
            const nextPresentation = nextDescriptor?.options.presentation;
            const isPreloaded = preloadedDescriptors[route.key] !== undefined && descriptors[route.key] === undefined;
            return (<elements_1.Screen key={route.key} focused={isFocused} route={route} navigation={navigation} headerShown={headerShown} headerTransparent={headerTransparent} header={header !== undefined ? (header({
                    back: headerBack,
                    options,
                    route,
                    navigation,
                })) : (<elements_1.Header {...rest} back={headerBack} title={(0, elements_1.getHeaderTitle)(options, route.name)} headerLeft={typeof headerLeft === 'function'
                        ? ({ label, ...rest }) => headerLeft({
                            ...rest,
                            label: headerBackTitle ?? label,
                        })
                        : headerLeft === undefined && canGoBack
                            ? ({ tintColor, label, ...rest }) => (<elements_1.HeaderBackButton {...rest} label={headerBackTitle ?? label} tintColor={tintColor} backImage={headerBackIcon !== undefined || headerBackImageSource !== undefined
                                    ? () => (<react_native_1.Image source={headerBackIcon?.source ?? headerBackImageSource} resizeMode="contain" tintColor={tintColor} style={styles.backImage}/>)
                                    : undefined} onPress={navigation.goBack}/>)
                            : headerLeft} headerTransparent={headerTransparent}/>)} style={[
                    react_native_1.StyleSheet.absoluteFill,
                    {
                        display: (isFocused ||
                            (nextPresentation != null &&
                                TRANSPARENT_PRESENTATIONS.includes(nextPresentation))) &&
                            !isPreloaded
                            ? 'flex'
                            : 'none',
                    },
                    presentation != null && TRANSPARENT_PRESENTATIONS.includes(presentation)
                        ? { backgroundColor: 'transparent' }
                        : null,
                ]}>
            <elements_1.HeaderBackContext.Provider value={headerBack}>
              <AnimatedHeaderHeightProvider>
                <react_native_1.View style={[styles.contentContainer, contentStyle]}>{render()}</react_native_1.View>
              </AnimatedHeaderHeightProvider>
            </elements_1.HeaderBackContext.Provider>
          </elements_1.Screen>);
        })}
    </elements_1.SafeAreaProviderCompat>);
}
const AnimatedHeaderHeightProvider = ({ children }) => {
    const headerHeight = (0, elements_1.useHeaderHeight)();
    const [animatedHeaderHeight] = React.useState(() => new react_native_1.Animated.Value(headerHeight));
    React.useEffect(() => {
        animatedHeaderHeight.setValue(headerHeight);
    }, [animatedHeaderHeight, headerHeight]);
    return (<useAnimatedHeaderHeight_1.AnimatedHeaderHeightContext.Provider value={animatedHeaderHeight}>
      {children}
    </useAnimatedHeaderHeight_1.AnimatedHeaderHeightContext.Provider>);
};
const styles = react_native_1.StyleSheet.create({
    contentContainer: {
        flex: 1,
    },
    backImage: {
        height: 24,
        width: 24,
        margin: 3,
    },
});
//# sourceMappingURL=NativeStackView.js.map