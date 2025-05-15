"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabsView = NativeTabsView;
const native_1 = require("@react-navigation/native");
const react_1 = __importDefault(require("react"));
const RNSNativeTabs_1 = require("./RNSNativeTabs");
const RNSNativeTabsScreen_1 = require("./RNSNativeTabsScreen");
function NativeTabsView(props) {
    const { state, descriptors, navigation } = props.builder;
    const { routes } = state;
    const children = routes.map((route, index) => {
        const descriptor = descriptors[route.key];
        const isFocused = state.index === index;
        return (<RNSNativeTabsScreen_1.RNSNativeTabsScreen key={route.key} isFocused={isFocused} badgeValue={descriptor.route.name} onAppear={() => {
                const href = descriptor.options?.href;
                if (href) {
                    const newState = (0, native_1.getStateFromPath)(href);
                    console.log(newState);
                    if (newState && (0, native_1.getPathFromState)(newState) !== (0, native_1.getPathFromState)(state)) {
                        return navigation.reset(newState);
                    }
                }
                navigation.dispatch(native_1.TabActions.jumpTo(route.name));
            }}>
        {descriptor.render()}
      </RNSNativeTabsScreen_1.RNSNativeTabsScreen>);
    });
    return <RNSNativeTabs_1.RNSNativeTabs>{children}</RNSNativeTabs_1.RNSNativeTabs>;
}
//# sourceMappingURL=NativeTabsView.js.map