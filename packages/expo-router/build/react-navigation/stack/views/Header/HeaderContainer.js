"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderContainer = HeaderContainer;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const Header_1 = require("./Header");
const elements_1 = require("../../../elements");
const native_1 = require("../../../native");
const HeaderStyleInterpolators_1 = require("../../TransitionConfigs/HeaderStyleInterpolators");
function HeaderContainer({ mode, scenes, layout, getPreviousScene, getFocusedRoute, onContentHeightChange, style, }) {
    const focusedRoute = getFocusedRoute();
    const parentHeaderBack = (0, react_1.use)(elements_1.HeaderBackContext);
    const { buildHref } = (0, native_1.useLinkBuilder)();
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.boxNone, style], children: scenes.slice(-2).map((scene, i, self) => {
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
            return ((0, jsx_runtime_1.jsx)(native_1.NavigationProvider, { route: scene.descriptor.route, navigation: scene.descriptor.navigation, children: (0, jsx_runtime_1.jsx)(react_native_1.View, { onLayout: onContentHeightChange
                        ? (e) => {
                            const { height } = e.nativeEvent.layout;
                            onContentHeightChange({
                                route: scene.descriptor.route,
                                height,
                            });
                        }
                        : undefined, "aria-hidden": !isFocused, style: [
                        {
                            pointerEvents: isFocused ? 'box-none' : 'none',
                        }, // Avoid positioning the focused header absolutely
                        // Otherwise accessibility tools don't seem to be able to find it
                        (mode === 'float' && !isFocused) || headerTransparent ? styles.header : null,
                    ], children: header !== undefined ? header(props) : (0, jsx_runtime_1.jsx)(Header_1.Header, { ...props }) }) }, scene.descriptor.route.key));
        }) }));
}
const styles = react_native_1.StyleSheet.create({
    boxNone: {
        pointerEvents: 'box-none',
    },
    header: {
        position: 'absolute',
        top: 0,
        start: 0,
        end: 0,
    },
});
//# sourceMappingURL=HeaderContainer.js.map