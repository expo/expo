"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialTopTabView = MaterialTopTabView;
const jsx_runtime_1 = require("react/jsx-runtime");
const native_1 = require("../../native");
const MaterialTopTabBar_1 = require("./MaterialTopTabBar");
const TabAnimationContext_1 = require("../utils/TabAnimationContext");
// Use dynamic import to avoid having direct dependency on react-native-tab-view.
// import { TabView } from 'react-native-tab-view';
let TabView;
try {
    const tabViewModule = require('react-native-tab-view');
    TabView = tabViewModule.TabView;
}
catch (e) {
    throw new Error("Install the 'react-native-tab-view' package and its peer dependencies to use the Expo Router's TopTabs.");
}
const renderTabBarDefault = (props) => (0, jsx_runtime_1.jsx)(MaterialTopTabBar_1.MaterialTopTabBar, { ...props });
function MaterialTopTabView({ tabBar = renderTabBarDefault, state, navigation, descriptors, ...rest }) {
    const { colors } = (0, native_1.useTheme)();
    const { direction } = (0, native_1.useLocale)();
    const renderTabBar = ({ 
    /* eslint-disable @typescript-eslint/no-unused-vars */
    navigationState, options, 
    /* eslint-enable @typescript-eslint/no-unused-vars */
    ...rest }) => {
        return tabBar({
            ...rest,
            state,
            navigation,
            descriptors,
        });
    };
    const focusedOptions = descriptors[state.routes[state.index].key].options;
    return ((0, jsx_runtime_1.jsx)(TabView, { ...rest, onIndexChange: (index) => {
            navigation.dispatch({
                ...native_1.CommonActions.navigate(state.routes[index]),
                target: state.key,
            });
        }, renderScene: ({ route, position }) => ((0, jsx_runtime_1.jsx)(TabAnimationContext_1.TabAnimationContext.Provider, { value: { position }, children: descriptors[route.key].render() })), navigationState: state, renderTabBar: renderTabBar, renderLazyPlaceholder: ({ route }) => descriptors[route.key].options.lazyPlaceholder?.() ?? null, lazy: ({ route }) => descriptors[route.key].options.lazy === true &&
            !state.preloadedRouteKeys.includes(route.key), lazyPreloadDistance: focusedOptions.lazyPreloadDistance, swipeEnabled: focusedOptions.swipeEnabled, animationEnabled: focusedOptions.animationEnabled, onSwipeStart: () => navigation.emit({ type: 'swipeStart' }), onSwipeEnd: () => navigation.emit({ type: 'swipeEnd' }), direction: direction, options: Object.fromEntries(state.routes.map((route) => {
            const options = descriptors[route.key]?.options;
            return [
                route.key,
                {
                    sceneStyle: [{ backgroundColor: colors.background }, options?.sceneStyle],
                },
            ];
        })) }));
}
//# sourceMappingURL=MaterialTopTabView.js.map