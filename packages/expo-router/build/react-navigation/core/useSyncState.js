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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSyncState = useSyncState;
const React = __importStar(require("react"));
const deepFreeze_1 = require("./deepFreeze");
const useLatestCallback_1 = __importDefault(require("../../utils/useLatestCallback"));
const createStore = (getInitialState) => {
    const listeners = [];
    let initialized = false;
    let state;
    const getState = () => {
        if (initialized) {
            return state;
        }
        initialized = true;
        state = (0, deepFreeze_1.deepFreeze)(getInitialState());
        return state;
    };
    let isBatching = false;
    let didUpdate = false;
    const setState = (newState) => {
        state = (0, deepFreeze_1.deepFreeze)(newState);
        didUpdate = true;
        if (!isBatching) {
            listeners.forEach((listener) => listener());
        }
    };
    const subscribe = (callback) => {
        listeners.push(callback);
        return () => {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    };
    const batchUpdates = (callback) => {
        isBatching = true;
        callback();
        isBatching = false;
        if (didUpdate) {
            didUpdate = false;
            listeners.forEach((listener) => listener());
        }
    };
    return {
        getState,
        setState,
        batchUpdates,
        subscribe,
    };
};
function useSyncState(getInitialState) {
    const store = React.useRef(createStore(getInitialState)).current;
    const state = React.useSyncExternalStore(store.subscribe, store.getState, store.getState);
    React.useDebugValue(state);
    const pendingUpdatesRef = React.useRef([]);
    const scheduleUpdate = (0, useLatestCallback_1.default)((callback) => {
        pendingUpdatesRef.current.push(callback);
    });
    const flushUpdates = (0, useLatestCallback_1.default)(() => {
        const pendingUpdates = pendingUpdatesRef.current;
        pendingUpdatesRef.current = [];
        if (pendingUpdates.length !== 0) {
            store.batchUpdates(() => {
                // Flush all the pending updates
                for (const update of pendingUpdates) {
                    update();
                }
            });
        }
    });
    return {
        state,
        getState: store.getState,
        setState: store.setState,
        scheduleUpdate,
        flushUpdates,
    };
}
//# sourceMappingURL=useSyncState.js.map