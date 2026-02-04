"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stack = void 0;
const StackClient_1 = __importDefault(require("./StackClient"));
exports.Stack = StackClient_1.default;
const stack_utils_1 = require("./stack-utils");
// Note(@ubax): Importing StackToolbar from separate file for rsc to work correctly
const StackToolbar_1 = require("./stack-utils/toolbar/StackToolbar");
StackClient_1.default.Screen = stack_utils_1.StackScreen;
StackClient_1.default.Header = stack_utils_1.StackHeader;
StackClient_1.default.Toolbar = StackToolbar_1.StackToolbar;
exports.default = StackClient_1.default;
//# sourceMappingURL=Stack.js.map