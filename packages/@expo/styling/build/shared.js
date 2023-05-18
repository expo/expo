"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRuntimeValue = void 0;
function isRuntimeValue(value) {
    if (!value) {
        return false;
    }
    else if (Array.isArray(value)) {
        return value.some((v) => isRuntimeValue(v));
    }
    else if (typeof value === "object") {
        if (value.type === "runtime") {
            return true;
        }
        else {
            return Object.values(value).some((v) => isRuntimeValue(v));
        }
    }
    else {
        return false;
    }
}
exports.isRuntimeValue = isRuntimeValue;
//# sourceMappingURL=shared.js.map