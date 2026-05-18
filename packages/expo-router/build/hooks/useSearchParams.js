"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSearchParams = useSearchParams;
const react_1 = __importDefault(require("react"));
const useGlobalSearchParams_1 = require("./useGlobalSearchParams");
const useLocalSearchParams_1 = require("./useLocalSearchParams");
// TODO(@ubax): Add missing JSDoc
function useSearchParams({ global = false } = {}) {
    const globalRef = react_1.default.useRef(global);
    if (process.env.NODE_ENV !== 'production') {
        if (global !== globalRef.current) {
            console.warn(`Detected change in 'global' option of useSearchParams. This value cannot change between renders`);
        }
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const params = global ? (0, useGlobalSearchParams_1.useGlobalSearchParams)() : (0, useLocalSearchParams_1.useLocalSearchParams)();
    const entries = Object.entries(params).flatMap(([key, value]) => {
        if (global) {
            if (key === 'params')
                return [];
            if (key === 'screen')
                return [];
        }
        return Array.isArray(value) ? value.map((v) => [key, v]) : [[key, value]];
    });
    return new ReadOnlyURLSearchParams(entries);
}
class ReadOnlyURLSearchParams extends URLSearchParams {
    set() {
        throw new Error('The URLSearchParams object return from useSearchParams is read-only');
    }
    append() {
        throw new Error('The URLSearchParams object return from useSearchParams is read-only');
    }
    delete() {
        throw new Error('The URLSearchParams object return from useSearchParams is read-only');
    }
}
//# sourceMappingURL=useSearchParams.js.map