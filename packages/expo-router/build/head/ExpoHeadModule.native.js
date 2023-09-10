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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoHead = void 0;
const expo_constants_1 = __importStar(require("expo-constants"));
const expo_modules_core_1 = require("expo-modules-core");
let ExpoHead = null;
exports.ExpoHead = ExpoHead;
if (expo_constants_1.default.executionEnvironment === expo_constants_1.ExecutionEnvironment.Bare) {
    // Loads the native module object from the JSI or falls back to
    // the bridge module (from NativeModulesProxy) if the remote debugger is on.
    exports.ExpoHead = ExpoHead = (0, expo_modules_core_1.requireNativeModule)('ExpoHead');
}
//# sourceMappingURL=ExpoHeadModule.native.js.map