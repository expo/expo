"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabsView = NativeTabsView;
const expo_modules_core_1 = require("expo-modules-core");
const react_1 = __importDefault(require("react"));
const react_native_screens_1 = require("react-native-screens");
// import { useBottomTabAccessory } from './NativeTabsViewContext';
const TabInfoContext_1 = require("./TabInfoContext");
const isControlledMode = expo_modules_core_1.Platform.OS === 'android';
react_native_screens_1.featureFlags.experiment.controlledBottomTabs = isControlledMode;
function NativeTabsView(props) {
    const { builder, style } = props;
    const { state, descriptors, navigation } = builder;
    const { routes } = state;
    // const { bottomTabAccessory } = useBottomTabAccessory();
    // const focusedScreenKey = state.routes[state.index].key;
    const children = routes
        .filter(({ key }) => !descriptors[key].options.hidden)
        .map((route, index) => {
        const descriptor = descriptors[route.key];
        const isFocused = state.index === index;
        return (<TabInfoContext_1.TabInfoContext value={{ tabKey: route.key }} key={route.key}>
          <react_native_screens_1.BottomTabsScreen {...descriptor.options} tabKey={route.key} isFocused={isFocused} onWillAppear={() => {
                console.log('On will appear', route.name);
                if (!isControlledMode) {
                    navigation.dispatch({
                        type: 'JUMP_TO',
                        target: state.key,
                        payload: {
                            name: route.name,
                        },
                    });
                }
            }}>
            {descriptor.render()}
          </react_native_screens_1.BottomTabsScreen>
        </TabInfoContext_1.TabInfoContext>);
    });
    return (<react_native_screens_1.BottomTabs tabBarItemTitleFontColor={style?.color} tabBarItemTitleFontFamily={style?.fontFamily} tabBarItemTitleFontSize={style?.fontSize} tabBarItemTitleFontWeight={style?.fontWeight} tabBarItemTitleFontStyle={style?.fontStyle} tabBarBackgroundColor={style?.backgroundColor} tabBarBlurEffect={style?.blurEffect} tabBarTintColor={style?.tintColor} tabBarItemBadgeBackgroundColor={style?.badgeBackgroundColor} onNativeFocusChange={({ nativeEvent: { tabKey } }) => {
            console.log('onNativeFocusChange', tabKey);
            if (isControlledMode) {
                const descriptor = descriptors[tabKey];
                const route = descriptor.route;
                navigation.dispatch({
                    type: 'JUMP_TO',
                    target: state.key,
                    payload: {
                        name: route.name,
                    },
                });
            }
            // navigation.emit({ type: 'tabPress', target: tabKey });
        }}>
      {children}
      {/* {focusedTabAccessoryProps && (
          <BottomAccessory
            {...focusedTabAccessoryProps}
            onTabAccessoryEnvironmentChange={({ nativeEvent }) => {
              console.log('onTabAccessoryEnvironmentChange', nativeEvent);
            }}
          />
        )} */}
    </react_native_screens_1.BottomTabs>);
}
//# sourceMappingURL=NativeTabsView.js.map