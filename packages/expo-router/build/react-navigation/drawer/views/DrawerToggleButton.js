"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrawerToggleButton = DrawerToggleButton;
const react_native_1 = require("react-native");
const toggle_drawer_icon_png_1 = __importDefault(require("../../../../../assets/react-navigation/drawer/toggle-drawer-icon.png"));
const elements_1 = require("../../elements");
const native_1 = require("../../native");
function DrawerToggleButton({ tintColor, accessibilityLabel = 'Show navigation menu', imageSource = toggle_drawer_icon_png_1.default, ...rest }) {
    const navigation = (0, native_1.useNavigation)();
    return (<elements_1.HeaderButton {...rest} accessibilityLabel={accessibilityLabel} onPress={() => navigation.dispatch(native_1.DrawerActions.toggleDrawer())}>
      <react_native_1.Image resizeMode="contain" source={imageSource} fadeDuration={0} tintColor={tintColor} style={styles.icon}/>
    </elements_1.HeaderButton>);
}
const styles = react_native_1.StyleSheet.create({
    icon: {
        height: 24,
        width: 24,
        marginVertical: 8,
        marginHorizontal: 5,
    },
});
//# sourceMappingURL=DrawerToggleButton.js.map