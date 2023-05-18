"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nativeCssTransform = void 0;
const metro_transform_worker_1 = __importDefault(require("metro-transform-worker"));
const css_modules_1 = require("./css-modules");
const css_to_rn_1 = require("../css-to-rn");
async function nativeCssTransform(config, projectRoot, filename, data, options) {
    const nativeStyles = (0, css_to_rn_1.cssToReactNativeRuntime)(data);
    if ((0, css_modules_1.matchCssModule)(filename)) {
        return metro_transform_worker_1.default.transform(config, projectRoot, filename, Buffer.from(`module.exports = require("@expo/styling").StyleSheet.create(${JSON.stringify(nativeStyles)});`), options);
    }
    else {
        return metro_transform_worker_1.default.transform(config, projectRoot, filename, Buffer.from(`require("@expo/styling").StyleSheet.register(${JSON.stringify(nativeStyles)});`), options);
    }
}
exports.nativeCssTransform = nativeCssTransform;
//# sourceMappingURL=nativeCssTransform.js.map