"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CODE_FONT = void 0;
const react_native_1 = require("react-native");
exports.CODE_FONT = react_native_1.Platform.select({
    default: 'Courier',
    ios: 'Courier New',
    android: 'monospace',
});
//# sourceMappingURL=constants.js.map