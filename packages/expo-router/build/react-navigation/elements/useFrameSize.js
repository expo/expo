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
exports.useFrameSize = useFrameSize;
exports.FrameSizeProvider = FrameSizeProvider;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const react_1 = require("react");
const react_native_1 = require("react-native");
const useLatestCallback_1 = __importDefault(require("../../utils/useLatestCallback"));
const useSyncExternalStoreWithSelector_1 = require("../../utils/useSyncExternalStoreWithSelector");
const FrameContext = React.createContext(undefined);
function useFrameSize(selector, throttle) {
    const context = (0, react_1.use)(FrameContext);
    if (context == null) {
        throw new Error('useFrameSize must be used within a FrameSizeProvider');
    }
    const value = (0, useSyncExternalStoreWithSelector_1.useSyncExternalStoreWithSelector)(throttle ? context.subscribeThrottled : context.subscribe, context.getCurrent, context.getCurrent, selector);
    return value;
}
function FrameSizeProvider({ initialFrame, render }) {
    const frameRef = React.useRef({
        width: initialFrame.width,
        height: initialFrame.height,
    });
    const listeners = React.useRef(new Set());
    const getCurrent = (0, useLatestCallback_1.default)(() => frameRef.current);
    const subscribe = (0, useLatestCallback_1.default)((listener) => {
        listeners.current.add(listener);
        return () => {
            listeners.current.delete(listener);
        };
    });
    const subscribeThrottled = (0, useLatestCallback_1.default)((listener) => {
        const delay = 100; // Throttle delay in milliseconds
        let timer;
        let updated = false;
        let waiting = false;
        const throttledListener = () => {
            clearTimeout(timer);
            updated = true;
            if (waiting) {
                // Schedule a timer to call the listener at the end
                timer = setTimeout(() => {
                    if (updated) {
                        updated = false;
                        listener();
                    }
                }, delay);
            }
            else {
                waiting = true;
                setTimeout(function () {
                    waiting = false;
                }, delay);
                // Call the listener immediately at start
                updated = false;
                listener();
            }
        };
        const unsubscribe = subscribe(throttledListener);
        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    });
    const context = React.useMemo(() => ({
        getCurrent,
        subscribe,
        subscribeThrottled,
    }), [subscribe, subscribeThrottled, getCurrent]);
    const onChange = (0, useLatestCallback_1.default)((frame) => {
        if (frameRef.current.height === frame.height && frameRef.current.width === frame.width) {
            return;
        }
        frameRef.current = { width: frame.width, height: frame.height };
        listeners.current.forEach((listener) => listener());
    });
    const viewRef = React.useRef(null);
    React.useEffect(() => {
        if (react_native_1.Platform.OS === 'web') {
            // We use ResizeObserver on web
            return;
        }
        viewRef.current?.measure((_x, _y, width, height) => {
            onChange({ width, height });
        });
    }, [onChange]);
    const onLayout = (event) => {
        const { width, height } = event.nativeEvent.layout;
        onChange({ width, height });
    };
    return ((0, jsx_runtime_1.jsxs)(FrameContext.Provider, { value: context, children: [react_native_1.Platform.OS === 'web' ? (0, jsx_runtime_1.jsx)(FrameSizeListenerWeb, { onChange: onChange }) : null, render({ ref: viewRef, onLayout })] }));
}
// FIXME: On the Web, `onLayout` doesn't fire on resize
// So we workaround this by using ResizeObserver
function FrameSizeListenerWeb({ onChange }) {
    const elementRef = React.useRef(null);
    React.useEffect(() => {
        if (elementRef.current == null) {
            return;
        }
        const rect = elementRef.current.getBoundingClientRect();
        onChange({
            width: rect.width,
            height: rect.height,
        });
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                const { width, height } = entry.contentRect;
                onChange({ width, height });
            }
        });
        observer.observe(elementRef.current);
        return () => {
            observer.disconnect();
        };
    }, [onChange]);
    return ((0, jsx_runtime_1.jsx)("div", { ref: elementRef, style: {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            pointerEvents: 'none',
            visibility: 'hidden',
        } }));
}
//# sourceMappingURL=useFrameSize.js.map