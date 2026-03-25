"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShadowStyle = getShadowStyle;
const color_1 = __importDefault(require("color"));
const react_native_1 = require("react-native");
function getShadowStyle({ offset, radius, opacity, color = '#000' }) {
    const result = react_native_1.Platform.select({
        web: {
            boxShadow: `${offset.width}px ${offset.height}px ${radius}px ${(0, color_1.default)(color)
                .alpha(opacity)
                .toString()}`,
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