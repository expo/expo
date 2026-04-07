"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Color = Color;
const color_1 = __importDefault(require("color"));
function Color(value) {
    if (typeof value === 'string' && !value.startsWith('var(')) {
        return (0, color_1.default)(value);
    }
    return undefined;
}
//# sourceMappingURL=color.js.map