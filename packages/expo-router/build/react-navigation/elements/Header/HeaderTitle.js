"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderTitle = HeaderTitle;
const react_native_1 = require("react-native");
const native_1 = require("../../native");
function HeaderTitle({ tintColor, style, ...rest }) {
    const { colors, fonts } = (0, native_1.useTheme)();
    return (<react_native_1.Animated.Text role="heading" aria-level="1" numberOfLines={1} {...rest} style={[
            { color: tintColor === undefined ? colors.text : tintColor },
            react_native_1.Platform.select({ ios: fonts.bold, default: fonts.medium }),
            styles.title,
            style,
        ]}/>);
}
const styles = react_native_1.StyleSheet.create({
    title: react_native_1.Platform.select({
        ios: {
            fontSize: 17,
        },
        android: {
            fontSize: 20,
        },
        default: {
            fontSize: 18,
        },
    }),
});
//# sourceMappingURL=HeaderTitle.js.map