"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stack = void 0;
const StackClient_1 = __importDefault(require("./StackClient"));
exports.Stack = StackClient_1.default;
const StackElements_1 = require("./StackElements");
StackClient_1.default.Screen = StackElements_1.StackScreen;
StackClient_1.default.Header = StackElements_1.StackHeader;
exports.default = StackClient_1.default;
//# sourceMappingURL=Stack.js.map