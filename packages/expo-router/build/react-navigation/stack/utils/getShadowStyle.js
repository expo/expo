"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShadowStyle = getShadowStyle;
const react_native_1 = require("react-native");
const color_1 = require("../../../utils/color");
function getShadowStyle({ offset, radius, opacity, color = '#000' }) {
    const result = react_native_1.Platform.select({
        web: {
            boxShadow: `${offset.width}px ${offset.height}px ${radius}px ${(0, color_1.Color)(color)?.alpha(opacity).toString() ?? ''}`,
        },
        default: {
            shadowOffset: offset,
            shadowRadius: radius,
            shadowColor: color,
            shadowOpacity: opacity,
        },
    });
    return result;
}
//# sourceMappingURL=getShadowStyle.js.map