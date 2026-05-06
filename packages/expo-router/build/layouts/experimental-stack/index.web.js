"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperimentalStack = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
// On web, fall back to the standard Stack. The `.web` extension keeps the web
// bundle from importing `react-native-screens/experimental`, which is native-only.
const Stack_1 = __importDefault(require("../Stack"));
const ExperimentalStack = Object.assign((props) => (0, jsx_runtime_1.jsx)(Stack_1.default, { ...props }), {
    Screen: Stack_1.default.Screen,
    Protected: Stack_1.default.Protected,
});
exports.ExperimentalStack = ExperimentalStack;
exports.default = ExperimentalStack;
//# sourceMappingURL=index.web.js.map