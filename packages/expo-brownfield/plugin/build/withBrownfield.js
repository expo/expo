"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const android_1 = __importDefault(require("./android"));
const common_1 = require("./common");
const ios_1 = __importDefault(require("./ios"));
const withExpoBrownfieldTargetPlugin = (config, props) => {
    // Warn the user that `expo-dev-launcher` is not supported with `expo-brownfield` yet
    (0, common_1.withDevLauncherWarning)(config);
    config = (0, android_1.default)(config, props?.android);
    return (0, ios_1.default)(config, props?.ios);
};
exports.default = withExpoBrownfieldTargetPlugin;
