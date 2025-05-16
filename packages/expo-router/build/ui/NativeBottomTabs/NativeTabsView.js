"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabsView = NativeTabsView;
const react_1 = __importDefault(require("react"));
const react_native_screens_1 = require("react-native-screens");
const BottomTabsScreen_1 = __importDefault(require("react-native-screens/src/components/BottomTabsScreen"));
function NativeTabsView(props) {
    const { state, descriptors, navigation } = props.builder;
    const { routes } = state;
    const children = routes
        .filter(({ key }) => descriptors[key].options?.tabBarItemStyle?.display !== 'none')
        .map((route, index) => {
        const descriptor = descriptors[route.key];
        const isFocused = state.index === index;
        /**
         * To get more tabs that feel more like iOS, we would need to add:
         * - title
         * - icon
         *
         * For icons I would propose either:
         * - passing a string and then using SF Symbols or Material Icons (how to do this on Android?) - androidx.compose.material.Icon
         *
         */
        return (<BottomTabsScreen_1.default key={route.key} isFocused={isFocused} badgeValue={descriptor.options?.label ?? descriptor.route.name} onWillAppear={() => {
                console.log('On will appear');
                navigation.dispatch({
                    type: 'JUMP_TO',
                    target: state.key,
                    payload: {
                        name: route.name,
                    },
                });
            }}>
          {descriptor.render()}
        </BottomTabsScreen_1.default>);
    });
    return <react_native_screens_1.BottomTabs>{children}</react_native_screens_1.BottomTabs>;
}
//# sourceMappingURL=NativeTabsView.js.map