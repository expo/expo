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
const elements_1 = require("@react-navigation/elements");
const native_1 = require("@react-navigation/native");
const react_1 = __importStar(require("react"));
const experimental_1 = require("react-native-screens/experimental");
function NativeStackView({ state, navigation, descriptors }) {
    const cachedDescriptors = (0, react_1.useMemo)(() => new Map(), []);
    return (<elements_1.SafeAreaProviderCompat>
      <experimental_1.Stack.Host>
        {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key] ?? cachedDescriptors.get(route.key);
            if (!descriptor) {
                throw new Error(`Descriptor not found for route ${route.name} ${route.key}`);
            }
            return (<native_1.NavigationContext.Provider key={route.key} value={descriptor.navigation}>
              <native_1.NavigationRouteContext.Provider value={route}>
                <experimental_1.Stack.Screen key={route.key} screenKey={route.key} activityMode={!state.poppedRoutes.has(route.key) ? 'attached' : 'detached'} 
            // Event callbacks
            onWillAppear={() => {
                    console.log('onWillAppear');
                    navigation.emit({
                        type: 'transitionStart',
                        data: { closing: false },
                        target: route.key,
                    });
                }} onDidAppear={() => {
                    console.log('onDidAppear');
                    navigation.emit({
                        type: 'transitionEnd',
                        data: { closing: false },
                        target: route.key,
                    });
                }} onWillDisappear={() => {
                    console.log('onWillDisappear');
                    navigation.emit({
                        type: 'transitionStart',
                        data: { closing: true },
                        target: route.key,
                    });
                    cachedDescriptors.set(route.key, descriptor);
                }} onDidDisappear={() => {
                    console.log('onDidDisappear');
                    navigation.emit({
                        type: 'transitionEnd',
                        data: { closing: true },
                        target: route.key,
                    });
                }} onDismiss={() => {
                    console.log('dismissing');
                    navigation.dispatch({
                        ...native_1.StackActions.pop(),
                        source: route.key,
                        target: state.key,
                    });
                }} onNativeDismiss={() => {
                    console.log('dismissing');
                    navigation.dispatch({
                        ...native_1.StackActions.pop(),
                        source: route.key,
                        target: state.key,
                    });
                }}>
                  {descriptor.render()}
                </experimental_1.Stack.Screen>
              </native_1.NavigationRouteContext.Provider>
            </native_1.NavigationContext.Provider>);
        })}
      </experimental_1.Stack.Host>
    </elements_1.SafeAreaProviderCompat>);
}
//# sourceMappingURL=NativeStackView.js.map