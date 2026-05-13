"use strict";
'use client';
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNavigationState = useNavigationState;
exports.NavigationStateListenerProvider = NavigationStateListenerProvider;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const useLatestCallback_1 = __importDefault(require("../../utils/useLatestCallback"));
const useSyncExternalStoreWithSelector_1 = require("../../utils/useSyncExternalStoreWithSelector");
/**
 * Hook to get a value from the current navigation state using a selector.
 *
 * @param selector Selector function to get a value from the state.
 */
function useNavigationState(selector) {
    const stateListener = (0, react_1.use)(NavigationStateListenerContext);
    if (stateListener == null) {
        throw new Error("Couldn't get the navigation state. Is your component inside a navigator?");
    }
    const value = (0, useSyncExternalStoreWithSelector_1.useSyncExternalStoreWithSelector)(stateListener.subscribe, 
    // @ts-expect-error: this is unsafe, but needed to make the generic work
    stateListener.getState, stateListener.getState, selector);
    return value;
}
function NavigationStateListenerProvider({ state, children, }) {
    const listeners = react_1.default.useRef([]);
    const stateRef = react_1.default.useRef(state);
    const getState = (0, useLatestCallback_1.default)(() => stateRef.current);
    const subscribe = (0, useLatestCallback_1.default)((callback) => {
        listeners.current.push(callback);
        return () => {
            listeners.current = listeners.current.filter((cb) => cb !== callback);
        };
    });
    react_1.default.useLayoutEffect(() => {
        stateRef.current = state;
        listeners.current.forEach((callback) => callback());
    }, [state]);
    const context = react_1.default.useMemo(() => ({
        getState,
        subscribe,
    }), [getState, subscribe]);
    return ((0, jsx_runtime_1.jsx)(NavigationStateListenerContext.Provider, { value: context, children: children }));
}
const NavigationStateListenerContext = react_1.default.createContext(undefined);
//# sourceMappingURL=useNavigationState.js.map