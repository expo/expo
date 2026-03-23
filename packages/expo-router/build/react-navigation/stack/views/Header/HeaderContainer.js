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
exports.HeaderContainer = HeaderContainer;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const Header_1 = require("./Header");
const elements_1 = require("../../../elements");
const native_1 = require("../../../native");
const HeaderStyleInterpolators_1 = require("../../TransitionConfigs/HeaderStyleInterpolators");
function HeaderContainer({ mode, scenes, layout, getPreviousScene, getFocusedRoute, onContentHeightChange, style, }) {
    const focusedRoute = getFocusedRoute();
    const parentHeaderBack = React.useContext(elements_1.HeaderBackContext);
    const { buildHref } = (0, native_1.useLinkBuilder)();
    return (<react_native_1.View pointerEvents="box-none" style={style}>
      {/* We render header only on two top-most headers as
           a workaround for https://github.com/react-navigation/react-navigation/issues/12456.
           If the header is persisted, it might be placed incorrectly when navigating back. */}
      {scenes.slice(-2).map((scene, i, self) => {
            if ((mode === 'screen' && i !== self.length - 1) || !scene) {
                return null;
            }
            const { header, headerMode, headerShown = true, headerTransparent, headerStyleInterpolator, } = scene.descriptor.options;
            if (headerMode !== mode || !headerShown) {
                return null;
            }
            const isFocused = focusedRoute.key === scene.descriptor.route.key;
            const previousScene = getPreviousScene({
                route: scene.descriptor.route,
            });
            let headerBack = parentHeaderBack;
            if (previousScene) {
                const { options, route } = previousScene.descriptor;
                headerBack = previousScene
                    ? {
                        title: (0, elements_1.getHeaderTitle)(options, route.name),
                        href: buildHref(route.name, route.params),
                    }
                    : parentHeaderBack;
            }
            // If the screen is next to a headerless screen, we need to make the header appear static
            // This makes the header look like it's moving with the screen
            const previousDescriptor = self[i - 1]?.descriptor;
            const nextDescriptor = self[i + 1]?.descriptor;
            const { headerShown: previousHeaderShown = true, headerMode: previousHeaderMode } = previousDescriptor?.options || {};
            // If any of the next screens don't have a header or header is part of the screen
            // Then we need to move this header offscreen so that it doesn't cover it
            const nextHeaderlessScene = self.slice(i + 1).find((scene) => {
                const { headerShown: currentHeaderShown = true, headerMode: currentHeaderMode } = scene?.descriptor.options || {};
                return currentHeaderShown === false || currentHeaderMode === 'screen';
            });
            const { gestureDirection: nextHeaderlessGestureDirection } = nextHeaderlessScene?.descriptor.options || {};
            const isHeaderStatic = ((previousHeaderShown === false || previousHeaderMode === 'screen') &&
                // We still need to animate when coming back from next scene
                // A hacky way to check this is if the next scene exists
                !nextDescriptor) ||
                nextHeaderlessScene;
            const props = {
                layout,
                back: headerBack,
                progress: scene.progress,
                options: scene.descriptor.options,
                route: scene.descriptor.route,
                navigation: scene.descriptor.navigation,
                styleInterpolator: mode === 'float'
                    ? isHeaderStatic
                        ? nextHeaderlessGestureDirection === 'vertical' ||
                            nextHeaderlessGestureDirection === 'vertical-inverted'
                            ? HeaderStyleInterpolators_1.forSlideUp
                            : nextHeaderlessGestureDirection === 'horizontal-inverted'
                                ? HeaderStyleInterpolators_1.forSlideRight
                                : HeaderStyleInterpolators_1.forSlideLeft
                        : headerStyleInterpolator
                    : HeaderStyleInterpolators_1.forNoAnimation,
            };
            return (<native_1.NavigationProvider key={scene.descriptor.route.key} route={scene.descriptor.route} navigation={scene.descriptor.navigation}>
            <react_native_1.View onLayout={onContentHeightChange
                    ? (e) => {
                        const { height } = e.nativeEvent.layout;
                        onContentHeightChange({
                            route: scene.descriptor.route,
                            height,
                        });
                    }
                    : undefined} pointerEvents={isFocused ? 'box-none' : 'none'} aria-hidden={!isFocused} style={
                // Avoid positioning the focused header absolutely
                // Otherwise accessibility tools don't seem to be able to find it
                (mode === 'float' && !isFocused) || headerTransparent ? styles.header : null}>
              {header !== undefined ? header(props) : <Header_1.Header {...props}/>}
            </react_native_1.View>
          </native_1.NavigationProvider>);
        })}
    </react_native_1.View>);
}
const styles = react_native_1.StyleSheet.create({
    header: {
        position: 'absolute',
        top: 0,
        start: 0,
        end: 0,
    },
});
//# sourceMappingURL=HeaderContainer.js.map