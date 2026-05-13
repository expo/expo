"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerStaticRootComponent = registerStaticRootComponent;
// @ts-expect-error: TODO(@kitten): Define this type (seems to differ from react-native)
const react_native_web_1 = require("react-native-web");
const APP_KEY = 'App';
function registerStaticRootComponent(component, initialProps) {
    react_native_web_1.AppRegistry.registerComponent(APP_KEY, () => component);
    return react_native_web_1.AppRegistry.getApplication(APP_KEY, { initialProps });
}
//# sourceMappingURL=registerRootComponent.js.map