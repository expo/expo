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
exports.createExperimentalStackNavigator = createExperimentalStackNavigator;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const react_1 = require("react");
const ExperimentalStackView_1 = require("./ExperimentalStackView");
const composition_options_1 = require("../../fork/native-stack/composition-options");
const native_1 = require("../../react-navigation/native");
function ExperimentalStackNavigator({ id, initialRouteName, UNSTABLE_routeNamesChangeBehavior, children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_router, ...rest }) {
    const { state, describe, descriptors, navigation, NavigationContent } = (0, native_1.useNavigationBuilder)(native_1.StackRouter, {
        id,
        initialRouteName,
        UNSTABLE_routeNamesChangeBehavior,
        children,
        layout,
        screenListeners,
        screenOptions,
        screenLayout,
        UNSTABLE_router,
    });
    const { registry, contextValue } = (0, composition_options_1.useCompositionRegistry)();
    const mergedDescriptors = (0, react_1.useMemo)(
    // TODO(@ubax): implement properly when more stack options are available
    () => (0, composition_options_1.mergeOptions)(descriptors, registry, state), [descriptors, registry, state]);
    const meta = (0, react_1.use)(native_1.NavigationMetaContext);
    React.useEffect(() => {
        if (meta && 'type' in meta && meta.type === 'native-tabs') {
            // Inside native tabs, popToTop is handled natively.
            return;
        }
        // @ts-expect-error: there may not be a tab navigator in parent
        return navigation?.addListener?.('tabPress', (e) => {
            const isFocused = navigation.isFocused();
            requestAnimationFrame(() => {
                if (state.index > 0 && isFocused && !e.defaultPrevented) {
                    navigation.dispatch({
                        ...native_1.StackActions.popToTop(),
                        target: state.key,
                    });
                }
            });
        });
    }, [meta, navigation, state.index, state.key]);
    return ((0, jsx_runtime_1.jsx)(NavigationContent, { children: (0, jsx_runtime_1.jsx)(composition_options_1.CompositionContext, { value: contextValue, children: (0, jsx_runtime_1.jsx)(ExperimentalStackView_1.ExperimentalStackView, { ...rest, state: state, navigation: navigation, descriptors: mergedDescriptors, describe: describe }) }) }));
}
function createExperimentalStackNavigator(config) {
    return (0, native_1.createNavigatorFactory)(ExperimentalStackNavigator)(config);
}
//# sourceMappingURL=createExperimentalStackNavigator.js.map