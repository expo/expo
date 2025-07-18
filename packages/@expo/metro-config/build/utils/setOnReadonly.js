"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setOnReadonly = setOnReadonly;
/** Set `value` on `obj[key]` while bypassing readonly property annotations */
function setOnReadonly(obj, key, value) {
    obj[key] = value;
}
//# sourceMappingURL=setOnReadonly.js.map