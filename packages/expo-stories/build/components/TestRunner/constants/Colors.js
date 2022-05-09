"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var styleguide_native_1 = require("@expo/styleguide-native");
var Statuses_1 = __importDefault(require("./Statuses"));
exports.default = (_a = {},
    _a[Statuses_1.default.Running] = styleguide_native_1.lightTheme.status.default,
    _a[Statuses_1.default.Passed] = styleguide_native_1.lightTheme.status.success,
    _a[Statuses_1.default.Failed] = styleguide_native_1.lightTheme.status.error,
    _a[Statuses_1.default.Disabled] = styleguide_native_1.lightTheme.status.warning,
    _a.tintColor = styleguide_native_1.lightTheme.status.info,
    _a.activeTintColor = styleguide_native_1.lightTheme.button.primary.background,
    _a.inactiveTintColor = styleguide_native_1.lightTheme.button.secondary.background,
    _a);
//# sourceMappingURL=Colors.js.map