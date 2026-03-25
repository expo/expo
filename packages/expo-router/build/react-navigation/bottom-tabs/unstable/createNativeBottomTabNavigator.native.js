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
exports.createNativeBottomTabNavigator = createNativeBottomTabNavigator;
const React = __importStar(require("react"));
const NativeBottomTabView_native_1 = require("./NativeBottomTabView.native");
const native_1 = require("../../native");
function NativeBottomTabNavigator({ id, initialRouteName, backBehavior, children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_router, UNSTABLE_routeNamesChangeBehavior, ...rest }) {
    const { state, navigation, descriptors, NavigationContent } = (0, native_1.useNavigationBuilder)(native_1.TabRouter, {
        id,
        initialRouteName,
        backBehavior,
        children,
        layout,
        screenListeners,
        screenOptions,
        screenLayout,
        UNSTABLE_router,
        UNSTABLE_routeNamesChangeBehavior,
    });
    const focusedRouteKey = state.routes[state.index].key;
    const previousRouteKeyRef = React.useRef(focusedRouteKey);
    React.useEffect(() => {
        const previousRouteKey = previousRouteKeyRef.current;
        if (previousRouteKey !== focusedRouteKey &&
            descriptors[previousRouteKey]?.options.popToTopOnBlur) {
            const prevRoute = state.routes.find((route) => route.key === previousRouteKey);
            if (prevRoute?.state?.type === 'stack' && prevRoute.state.key) {
                const popToTopAction = {
                    ...native_1.StackActions.popToTop(),
                    target: prevRoute.state.key,
                };
                navigation.dispatch(popToTopAction);
            }
        }
        previousRouteKeyRef.current = focusedRouteKey;
    }, [descriptors, focusedRouteKey, navigation, state.index, state.routes]);
    return (<NavigationContent>
      <NativeBottomTabView_native_1.NativeBottomTabView {...rest} state={state} navigation={navigation} descriptors={descriptors}/>
    </NavigationContent>);
}
function createNativeBottomTabNavigator(config) {
    return (0, native_1.createNavigatorFactory)(NativeBottomTabNavigator)(config);
}
//# sourceMappingURL=createNativeBottomTabNavigator.native.js.map