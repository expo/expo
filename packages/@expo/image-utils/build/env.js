"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
class Env {
    /** Enable image utils related debugging messages */
    get EXPO_IMAGE_UTILS_DEBUG() {
        return ['true', '1'].includes((process.env.EXPO_IMAGE_UTILS_DEBUG ?? '').toLowerCase());
    }
    /** Disable all Sharp related functionality. */
    get EXPO_IMAGE_UTILS_NO_SHARP() {
        return ['true', '1'].includes((process.env.EXPO_IMAGE_UTILS_NO_SHARP ?? '').toLowerCase());
    }
}
exports.env = new Env();
//# sourceMappingURL=env.js.map