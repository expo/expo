"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireContext = exports.inMemoryContext = void 0;
var context_stubs_1 = require("../testing-library/context-stubs");
Object.defineProperty(exports, "inMemoryContext", { enumerable: true, get: function () { return context_stubs_1.inMemoryContext; } });
var require_context_ponyfill_1 = require("../testing-library/require-context-ponyfill");
Object.defineProperty(exports, "requireContext", { enumerable: true, get: function () { return __importDefault(require_context_ponyfill_1).default; } });
//# sourceMappingURL=testing.js.map