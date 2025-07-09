"use strict";
'use client';
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
exports.RouterModalScreen = exports.RouterModal = void 0;
const native_1 = require("@react-navigation/native");
const native_stack_1 = require("@react-navigation/native-stack");
const react_1 = __importStar(require("react"));
const ModalStackRouteDrawer_web_1 = require("./ModalStackRouteDrawer.web");
const TransparentModalStackRouteDrawer_web_1 = require("./TransparentModalStackRouteDrawer.web");
const utils_1 = require("./utils");
const withLayoutContext_1 = require("../../layouts/withLayoutContext");
function ModalStackNavigator({ initialRouteName, children, screenOptions, }) {
    const { state, navigation, descriptors, NavigationContent, describe } = (0, native_1.useNavigationBuilder)(native_1.StackRouter, {
        children,
        screenOptions,
        initialRouteName,
    });
    return (<NavigationContent>
      <ModalStackView state={state} navigation={navigation} descriptors={descriptors} describe={describe}/>
    </NavigationContent>);
}
const ModalStackView = ({ state, navigation, descriptors, describe }) => {
    const isWeb = process.env.EXPO_OS === 'web';
    const { colors } = (0, native_1.useTheme)();
    const { routes: filteredRoutes, index: nonModalIndex } = (0, utils_1.convertStackStateToNonModalState)(state, descriptors, isWeb);
    const newStackState = { ...state, routes: filteredRoutes, index: nonModalIndex };
    const dismiss = (0, react_1.useCallback)(() => {
        navigation.goBack();
    }, [navigation]);
    const overlayRoutes = react_1.default.useMemo(() => {
        if (!isWeb)
            return [];
        const idx = (0, utils_1.findLastNonModalIndex)(state, descriptors);
        return state.routes.slice(idx + 1);
    }, [isWeb, state, descriptors]);
    return (<div style={{ flex: 1, display: 'flex' }}>
      <native_stack_1.NativeStackView state={newStackState} navigation={navigation} descriptors={descriptors} describe={describe}/>
      {isWeb &&
            overlayRoutes.map((route) => {
                const isTransparentModal = (0, utils_1.isTransparentModalPresentation)(descriptors[route.key].options);
                if (isTransparentModal) {
                    return (<TransparentModalStackRouteDrawer_web_1.TransparentModalStackRouteDrawer key={route.key} routeKey={route.key} options={descriptors[route.key].options} renderScreen={descriptors[route.key].render} onDismiss={dismiss}/>);
                }
                return (<ModalStackRouteDrawer_web_1.ModalStackRouteDrawer key={route.key} routeKey={route.key} options={descriptors[route.key].options} renderScreen={descriptors[route.key].render} onDismiss={dismiss} themeColors={colors}/>);
            })}
    </div>);
};
const createModalStack = (0, native_1.createNavigatorFactory)(ModalStackNavigator);
const RouterModal = (0, withLayoutContext_1.withLayoutContext)(createModalStack().Navigator);
exports.RouterModal = RouterModal;
const RouterModalScreen = RouterModal.Screen;
exports.RouterModalScreen = RouterModalScreen;
//# sourceMappingURL=ModalStack.web.js.map