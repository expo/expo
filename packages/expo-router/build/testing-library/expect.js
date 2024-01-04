"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const matchers_1 = __importDefault(require("expect/build/matchers"));
matchers_1.default.customTesters = [];
expect.extend({
    toHavePathname(screen, expected) {
        return matchers_1.default.toEqual(screen.getPathname(), expected);
    },
    toHavePathnameWithParams(screen, expected) {
        return matchers_1.default.toEqual(screen.getPathnameWithParams(), expected);
    },
    toHaveSegments(screen, expected) {
        return matchers_1.default.toEqual(screen.getSegments(), expected);
    },
    toHaveSearchParams(screen, expected) {
        return matchers_1.default.toEqual(screen.getSearchParams(), expected);
    },
});
//# sourceMappingURL=expect.js.map