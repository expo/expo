"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stack = void 0;
// This will be changed to `ExperimentalModalStack` in @expo/cli/src/start/server/metro/withMetroMultiPlatform.ts
// When the `EXPO_UNSTABLE_WEB_MODAL` env variable is truthy.
const _web_modal_1 = __importDefault(require("./_web-modal"));
exports.Stack = _web_modal_1.default;
const elements_1 = require("./stack-utils/elements");
_web_modal_1.default.Screen = elements_1.StackScreen;
_web_modal_1.default.Header = elements_1.StackHeader;
exports.default = _web_modal_1.default;
//# sourceMappingURL=Stack.web.js.map