"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CODE_FONT = void 0;
exports.CODE_FONT = process.env.EXPO_OS === 'ios'
    ? // iOS
        'Courier New'
    : process.env.EXPO_OS === 'android'
        ? // Android
            'monospace'
        : // Default
            'Courier';
//# sourceMappingURL=constants.js.map