"use strict";
// This is the main export for `@expo/log-box/utils` used in the `@expo/cli` and `expo/async-require/hmr`
// This needs to be transpiled to CJS for use in the Expo CLI
Object.defineProperty(exports, "__esModule", { value: true });
exports.withoutANSIColorStyles = exports.parseWebBuildErrors = void 0;
var parseWebBuildErrors_1 = require("./utils/parseWebBuildErrors");
Object.defineProperty(exports, "parseWebBuildErrors", { enumerable: true, get: function () { return parseWebBuildErrors_1.parseWebBuildErrors; } });
var withoutANSIStyles_1 = require("./utils/withoutANSIStyles");
Object.defineProperty(exports, "withoutANSIColorStyles", { enumerable: true, get: function () { return withoutANSIStyles_1.withoutANSIColorStyles; } });
