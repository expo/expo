'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const _ctx_1 = require("../../_ctx");
const ExpoRoot_1 = require("../ExpoRoot");
function LegacyExpoRoot({ location }) {
    return <ExpoRoot_1.ExpoRoot location={location} context={_ctx_1.ctx}></ExpoRoot_1.ExpoRoot>;
}
exports.default = LegacyExpoRoot;
//# sourceMappingURL=legacy-client-root.js.map