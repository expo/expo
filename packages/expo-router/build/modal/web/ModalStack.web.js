"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterModalScreen = exports.RouterModal = void 0;
exports.convertStackStateToNonModalState = convertStackStateToNonModalState;
const native_1 = require("@react-navigation/native");
const native_stack_1 = require("@react-navigation/native-stack");
const react_1 = __importDefault(require("react"));
const ModalStackRouteDrawer_web_1 = require("./ModalStackRouteDrawer.web");
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
    const { routes: filteredRoutes, index: nonModalIndex } = convertStackStateToNonModalState(state, descriptors, isWeb);
    const newStackState = { ...state, routes: filteredRoutes, index: nonModalIndex };
    return (<div style={{ flex: 1, display: 'flex' }}>
      <native_stack_1.NativeStackView state={newStackState} navigation={navigation} descriptors={descriptors} describe={describe}/>
      {isWeb &&
            state.routes.map((route, i) => {
                const isModalType = (0, utils_1.isModalPresentation)(descriptors[route.key].options);
                const isActive = i === state.index && isModalType;
                if (!isActive)
                    return null;
                return (<ModalStackRouteDrawer_web_1.ModalStackRouteDrawer key={route.key} routeKey={route.key} options={descriptors[route.key].options} renderScreen={descriptors[route.key].render} onDismiss={() => navigation.goBack()} themeColors={colors}/>);
            })}
    </div>);
};
const createModalStack = (0, native_1.createNavigatorFactory)(ModalStackNavigator);
const RouterModal = (0, withLayoutContext_1.withLayoutContext)(createModalStack().Navigator);
exports.RouterModal = RouterModal;
const RouterModalScreen = RouterModal.Screen;
exports.RouterModalScreen = RouterModalScreen;
/**
 * Returns a copy of the given Stack navigation state with any modal-type routes removed
 * (only when running on the web) and a recalculated `index` that still points at the
 * currently active non-modal route. If the active route *is* a modal that gets
 * filtered out, we fall back to the last remaining route – this matches the logic
 * used inside `ModalStackView` so that the underlying `NativeStackView` never tries
 * to render a modal screen that is simultaneously being shown in the overlay.
 *
 * This helper is exported primarily for unit-testing; it should be considered
 * internal to `ModalStack.web` and not a public API.
 *
 * @internal
 */
function convertStackStateToNonModalState(state, descriptors, isWeb) {
    const routes = state.routes.filter((route) => {
        const isModalType = (0, utils_1.isModalPresentation)(descriptors[route.key].options);
        return !(isWeb && isModalType);
    });
    let index = routes.findIndex((r) => r.key === state.routes[state.index]?.key);
    if (index < 0)
        index = routes.length - 1;
    return { routes, index };
}
//# sourceMappingURL=ModalStack.web.js.map