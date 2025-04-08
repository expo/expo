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
exports.createNativeStackNavigator = createNativeStackNavigator;
const native_1 = require("@react-navigation/native");
const native_stack_1 = require("@react-navigation/native-stack");
const React = __importStar(require("react"));
function NativeStackNavigator({ id, initialRouteName, children, layout, screenListeners, screenOptions, screenLayout, ...rest }) {
    const { state, describe, descriptors, navigation, NavigationContent } = (0, native_1.useNavigationBuilder)(native_1.StackRouter, {
        id,
        initialRouteName,
        children,
        layout,
        screenListeners,
        screenOptions,
        screenLayout,
    });
    React.useEffect(() => 
    // @ts-expect-error: there may not be a tab navigator in parent
    navigation?.addListener?.('tabPress', (e) => {
        const isFocused = navigation.isFocused();
        // Run the operation in the next frame so we're sure all listeners have been run
        // This is necessary to know if preventDefault() has been called
        requestAnimationFrame(() => {
            if (state.index > 0 && isFocused && !e.defaultPrevented) {
                // When user taps on already focused tab and we're inside the tab,
                // reset the stack to replicate native behaviour
                navigation.dispatch({
                    ...native_1.StackActions.popToTop(),
                    target: state.key,
                });
            }
        });
    }), [navigation, state.index, state.key]);
    return (<NavigationContent>
      <native_stack_1.NativeStackView {...rest} state={state} navigation={navigation} descriptors={descriptors} describe={describe}/>
    </NavigationContent>);
}
function createNativeStackNavigator(config) {
    return (0, native_1.createNavigatorFactory)(NativeStackNavigator)(config);
}
//# sourceMappingURL=createNativeStackNavigator.js.map