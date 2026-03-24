"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useKeyedChildListeners = useKeyedChildListeners;
const React = __importStar(require("react"));
/**
 * Hook which lets child navigators add getters to be called for obtaining rehydrated state.
 */
function useKeyedChildListeners() {
    const { current: keyedListeners } = React.useRef(Object.assign(Object.create(null), {
        getState: {},
        beforeRemove: {},
    }));
    const addKeyedListener = React.useCallback((type, key, listener) => {
        // @ts-expect-error: according to ref stated above you can use `key` to index type
        keyedListeners[type][key] = listener;
        return () => {
            // @ts-expect-error: according to ref stated above you can use `key` to index type
            keyedListeners[type][key] = undefined;
        };
    }, [keyedListeners]);
    return {
        keyedListeners,
        addKeyedListener,
    };
}
//# sourceMappingURL=useKeyedChildListeners.js.map