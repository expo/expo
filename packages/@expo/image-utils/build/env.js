"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const getenv_1 = require("getenv");
class Env {
    /** Enable image utils related debugging messages */
    get EXPO_IMAGE_UTILS_DEBUG() {
        return (0, getenv_1.boolish)('EXPO_IMAGE_UTILS_DEBUG', false);
    }
    /** Disable all Sharp related functionality. */
    get EXPO_IMAGE_UTILS_NO_SHARP() {
        return (0, getenv_1.boolish)('EXPO_IMAGE_UTILS_NO_SHARP', false);
    }
}
exports.env = new Env();
//# sourceMappingURL=env.js.map