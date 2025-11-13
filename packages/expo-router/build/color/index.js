"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Color = void 0;
const react_native_1 = require("react-native");
const materialColor_1 = require("./materialColor");
__exportStar(require("./android.color.types"), exports);
__exportStar(require("./android.attr.types"), exports);
__exportStar(require("./android.dynamic.types"), exports);
__exportStar(require("./android.material.types"), exports);
__exportStar(require("./ios.types"), exports);
const iosColor = new Proxy({}, {
    get(_, prop) {
        return (0, react_native_1.PlatformColor)(prop);
    },
});
const androidAttrColor = new Proxy({}, {
    get(_, prop) {
        return (0, react_native_1.PlatformColor)('?attr/' + prop);
    },
});
const androidMaterialColor = new Proxy({}, {
    get(_, prop) {
        return (0, materialColor_1.Material3Color)(prop);
    },
});
const androidDynamicColor = new Proxy({}, {
    get(_, prop) {
        return (0, materialColor_1.Material3DynamicColor)(prop);
    },
});
const androidColor = new Proxy({
    get attr() {
        return androidAttrColor;
    },
    get material() {
        return androidMaterialColor;
    },
    get dynamic() {
        return androidDynamicColor;
    },
}, {
    get(target, prop) {
        if (prop in target) {
            return target[prop];
        }
        return (0, react_native_1.PlatformColor)('@android:color/' + prop);
    },
});
exports.Color = {
    get ios() {
        return iosColor;
    },
    get android() {
        return androidColor;
    },
};
//# sourceMappingURL=index.js.map