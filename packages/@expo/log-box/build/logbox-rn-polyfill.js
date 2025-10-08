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
const expo_1 = require("expo");
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
// @ts-ignore
const LogBoxData = __importStar(require("react-native/Libraries/LogBox/Data/LogBoxData"));
// @ts-ignore
const RCTModalHostViewNativeComponent_1 = __importDefault(require("react-native/Libraries/Modal/RCTModalHostViewNativeComponent"));
const logbox_dom_polyfill_1 = __importDefault(require("./logbox-dom-polyfill"));
const devServerEndpoints_1 = require("./utils/devServerEndpoints");
const Modal = RCTModalHostViewNativeComponent_1.default;
const Colors = {
    background: '#111113',
};
function LogBoxRNPolyfill(props) {
    const logs = react_1.default.useMemo(() => {
        return props.logs.map((log) => {
            return {
                symbolicated: log.symbolicated,
                symbolicatedComponentStack: log.symbolicatedComponentStack,
                componentCodeFrame: log.componentCodeFrame,
                level: log.level,
                type: log.type,
                message: log.message,
                stack: log.stack,
                category: log.category,
                componentStack: log.componentStack,
                componentStackType: log.componentStackType,
                codeFrame: log.codeFrame,
                isComponentError: log.isComponentError,
                extraData: log.extraData,
                count: log.count,
            };
        });
    }, [props.logs]);
    const [open, setOpen] = react_1.default.useState(true);
    const bundledLogBoxUrl = getBundledLogBoxURL();
    const closeModal = (cb) => {
        setOpen(false);
        setTimeout(cb, react_native_1.Platform.select({ ios: 500, default: 0 }));
    };
    const onMinimize = () => closeModal(props.onMinimize);
    const onDismiss = props.onDismiss;
    const LogBoxWrapper = (0, react_1.useMemo)(() => react_native_1.Platform.OS === 'ios'
        ? ({ children }) => {
            return (react_1.default.createElement(Modal, { animationType: "slide", presentationStyle: "pageSheet", visible: open, onRequestClose: onMinimize }, children));
        }
        : ({ children }) => react_1.default.createElement(react_1.default.Fragment, null, children), []);
    return (react_1.default.createElement(LogBoxWrapper, null,
        react_1.default.createElement(react_native_1.View, { style: {
                backgroundColor: react_native_1.Platform.select({ default: undefined, ios: Colors.background }),
                pointerEvents: 'box-none',
                top: 0,
                flex: 1,
            }, collapsable: false },
            react_1.default.createElement(logbox_dom_polyfill_1.default, { platform: process.env.EXPO_OS, devServerUrl: (0, devServerEndpoints_1.getBaseUrl)(), dom: {
                    sourceOverride: bundledLogBoxUrl ? { uri: bundledLogBoxUrl } : undefined,
                    contentInsetAdjustmentBehavior: 'never',
                    containerStyle: {
                        pointerEvents: 'box-none',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                    },
                    style: {
                        flex: 1,
                    },
                    suppressMenuItems: ['underline', 'lookup', 'translate'],
                    bounces: true,
                    overScrollMode: 'never',
                }, fetchJsonAsync: async (input, init) => {
                    try {
                        const res = await fetch(input, init);
                        return await res.text();
                    }
                    catch (e) {
                        throw e;
                    }
                }, reloadRuntime: () => {
                    // NOTE: For iOS only the reload is enough, but on Android the app gets stuck on an empty black screen
                    onMinimize();
                    setTimeout(() => {
                        react_native_1.DevSettings.reload();
                    }, 100);
                }, onCopyText: (text) => {
                    react_native_1.Clipboard.setString(text);
                }, onDismiss: onDismiss, onMinimize: onMinimize, onChangeSelectedIndex: props.onChangeSelectedIndex, selectedIndex: props.selectedIndex, logs: logs }))));
}
function LogBoxInspectorContainer({ selectedLogIndex, logs, }) {
    const handleDismiss = (index) => {
        LogBoxData.dismiss(logs[index]);
    };
    const handleMinimize = () => {
        LogBoxData.setSelectedLog(-1);
    };
    const handleSetSelectedLog = (index) => {
        LogBoxData.setSelectedLog(index);
    };
    if (selectedLogIndex < 0) {
        return null;
    }
    return (react_1.default.createElement(LogBoxRNPolyfill, { onDismiss: handleDismiss, onMinimize: handleMinimize, onChangeSelectedIndex: handleSetSelectedLog, logs: logs, selectedIndex: selectedLogIndex }));
}
let cachedBundledLogBoxUrl = undefined;
/**
 * Get the base URL for the Expo LogBox Prebuilt DOM Component HTML
 */
function getBundledLogBoxURL() {
    if (cachedBundledLogBoxUrl !== undefined) {
        return cachedBundledLogBoxUrl;
    }
    if ((0, expo_1.isRunningInExpoGo)()) {
        // TODO: This will require a new version of Expo Go with the prebuilt Expo LogBox DOM Components
        cachedBundledLogBoxUrl = null;
        return null;
    }
    // Serving prebuilt from application bundle
    if (process.env.EXPO_OS === 'android') {
        cachedBundledLogBoxUrl = 'file:///android_asset/ExpoLogBox.bundle/index.html';
    }
    else if (process.env.EXPO_OS === 'ios') {
        cachedBundledLogBoxUrl = 'ExpoLogBox.bundle/index.html';
    }
    else {
        // Other platforms do not support the bundled LogBox DOM Component
        cachedBundledLogBoxUrl = null;
    }
    return cachedBundledLogBoxUrl;
}
exports.default = LogBoxData.withSubscription(LogBoxInspectorContainer);
