"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabsView = NativeTabsView;
const react_1 = __importDefault(require("react"));
const RNSNativeTabs_1 = require("./RNSNativeTabs");
const RNSNativeTabsScreen_1 = require("./RNSNativeTabsScreen");
const hooks_1 = require("../../hooks");
function NativeTabsView(props) {
    const { state, descriptors, navigation } = props.builder;
    const { routes } = state;
    console.log((0, hooks_1.usePathname)());
    const children = routes
        .filter(({ key }) => descriptors[key].options?.tabBarItemStyle?.display !== 'none')
        .map((route, index) => {
        const descriptor = descriptors[route.key];
        const isFocused = state.index === index;
        return (<RNSNativeTabsScreen_1.RNSNativeTabsScreen key={route.key} isFocused={isFocused} badgeValue={descriptor.route.name} onAppear={() => {
                navigation.dispatch({
                    type: 'JUMP_TO',
                    target: state.key,
                    payload: {
                        name: route.name,
                    },
                });
            }}>
          {descriptor.render()}
        </RNSNativeTabsScreen_1.RNSNativeTabsScreen>);
    });
    return <RNSNativeTabs_1.RNSNativeTabs>{children}</RNSNativeTabs_1.RNSNativeTabs>;
}
//# sourceMappingURL=NativeTabsView.js.map