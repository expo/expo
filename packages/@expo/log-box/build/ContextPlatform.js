"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRuntimePlatform = exports.withRuntimePlatform = exports.RuntimePlatformProvider = void 0;
const react_1 = __importDefault(require("react"));
const react_2 = require("react");
const RuntimePlatformContext = (0, react_2.createContext)(undefined);
const RuntimePlatformProvider = ({ children, platform }) => {
    const isNative = (0, react_2.useMemo)(() => {
        return platform === 'ios' || platform === 'android';
    }, [platform]);
    return (react_1.default.createElement(RuntimePlatformContext.Provider, { value: { platform, isNative } }, children));
};
exports.RuntimePlatformProvider = RuntimePlatformProvider;
const withRuntimePlatform = (Component, options) => {
    return (props) => (react_1.default.createElement(exports.RuntimePlatformProvider, { platform: options.platform },
        react_1.default.createElement(Component, { ...props })));
};
exports.withRuntimePlatform = withRuntimePlatform;
const useRuntimePlatform = () => {
    const context = (0, react_2.useContext)(RuntimePlatformContext);
    if (context === undefined) {
        // return { platform: 'web', isNative: false };
        throw new Error('useRuntimePlatform must be used within a RuntimePlatformProvider');
    }
    return context;
};
exports.useRuntimePlatform = useRuntimePlatform;
