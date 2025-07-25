"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabs = exports.createNativeTabNavigator = void 0;
const native_1 = require("@react-navigation/native");
const react_1 = __importDefault(require("react"));
const react_native_screens_1 = require("react-native-screens");
const NativeBottomTabsRouter_1 = require("./NativeBottomTabsRouter");
const NativeTabsView_1 = require("./NativeTabsView");
const __1 = require("../..");
const NativeTabsViewContext_1 = require("./NativeTabsViewContext");
const TabOptions_1 = require("./TabOptions");
(0, react_native_screens_1.enableFreeze)(true);
function NativeTabsNavigator({ children, ...rest }) {
    const builder = (0, native_1.useNavigationBuilder)(NativeBottomTabsRouter_1.NativeBottomTabsRouter, {
        children,
    });
    return (<NativeTabsViewContext_1.BottomTabAccessoryProvider>
      <NativeTabsView_1.NativeTabsView builder={builder} {...rest}/>
    </NativeTabsViewContext_1.BottomTabAccessoryProvider>);
}
exports.createNativeTabNavigator = (0, native_1.createNavigatorFactory)(NativeTabsNavigator);
const NTN = (0, __1.withLayoutContext)((0, exports.createNativeTabNavigator)().Navigator, (screens) => {
    return screens;
}, true);
exports.NativeTabs = Object.assign((props) => {
    return <NTN {...props}/>;
}, { Trigger: TabOptions_1.Tab });
//# sourceMappingURL=NativeBottomTabsNavigator.js.map