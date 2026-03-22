"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeStackWithContext = void 0;
exports.NativeStackNavigator = NativeStackNavigator;
const native_1 = require("@react-navigation/native");
const NativeStackRouter_1 = require("./NativeStackRouter");
const NativeStackView_1 = require("./NativeStackView");
const withLayoutContext_1 = require("../layouts/withLayoutContext");
function NativeStackNavigator({ children, screenListeners, screenOptions, }) {
    const { state, descriptors, navigation, NavigationContent } = (0, native_1.useNavigationBuilder)(NativeStackRouter_1.NativeStackRouter, {
        children,
        screenListeners,
        screenOptions,
    });
    return (<NavigationContent>
      <NativeStackView_1.NativeStackView state={state} navigation={navigation} descriptors={descriptors}/>
    </NavigationContent>);
}
const createNativeStackNavigatorFactory = (0, native_1.createNavigatorFactory)(NativeStackNavigator);
exports.NativeStackWithContext = (0, withLayoutContext_1.withLayoutContext)(createNativeStackNavigatorFactory().Navigator);
//# sourceMappingURL=NativeStackNavigator.js.map