"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = App;
const jsx_runtime_1 = require("react/jsx-runtime");
// The entry component (one that uses context modules) cannot be in the same file as the
// entry side-effects, otherwise they'll be updated when files are added/removed from the
// app directory. This will cause a lot of unfortunate errors regarding HMR and Fast Refresh.
// This is because Fast Refresh is sending the entire file containing an updated component.
// This has to be the string "expo-router/_ctx" as we resolve the exact string to
// a different file in a custom resolver for bundle splitting in Node.js.
//
// @ts-ignore: Will not self-resolve without package.json:exports
const _ctx_1 = require("expo-router/_ctx");
require("react");
const ExpoRoot_1 = require("./ExpoRoot");
const head_1 = require("./head");
require("./fast-refresh");
// Must be exported or Fast Refresh won't update the context
function App() {
    return ((0, jsx_runtime_1.jsx)(head_1.Head.Provider, { children: (0, jsx_runtime_1.jsx)(ExpoRoot_1.ExpoRoot, { context: _ctx_1.ctx }) }));
}
//# sourceMappingURL=qualified-entry.js.map