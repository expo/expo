"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Text = Text;
const react_native_1 = require("react-native");
const native_1 = require("../native");
// eslint-disable-next-line no-restricted-imports
function Text({ style, ...rest }) {
    const { colors, fonts } = (0, native_1.useTheme)();
    return <react_native_1.Text {...rest} style={[{ color: colors.text }, fonts.regular, style]}/>;
}
//# sourceMappingURL=Text.js.map