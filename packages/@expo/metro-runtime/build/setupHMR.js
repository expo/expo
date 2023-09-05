"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const HMRClient_1 = __importDefault(require("./HMRClient"));
// Sets up developer tools for React Native web.
// We assume full control over the console and send JavaScript logs to Metro.
// [
//   'trace',
//   'info',
//   'warn',
//   'error',
//   'log',
//   'group',
//   'groupCollapsed',
//   'groupEnd',
//   'debug',
// ].forEach(level => {
//   const originalFunction = console[level];
//   console[level] = function (...args: readonly any[]) {
//     HMRClient.log(
//       // @ts-expect-error
//       level, args);
//     originalFunction.apply(console, args);
//   };
// });
HMRClient_1.default.log('log', [`[web] Logs will appear in the browser console`]);
// This is called native on native platforms
HMRClient_1.default.setup({ isEnabled: true });
//# sourceMappingURL=setupHMR.js.map