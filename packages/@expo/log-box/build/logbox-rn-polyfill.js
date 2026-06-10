import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { requireNativeModule } from 'expo-modules-core';
import React, { useMemo } from 'react';
import { View, DevSettings, Platform, Clipboard } from 'react-native';
// @ts-ignore
import * as LogBoxData from 'react-native/Libraries/LogBox/Data/LogBoxData';
// @ts-ignore
import RCTModalHostView from 'react-native/Libraries/Modal/RCTModalHostViewNativeComponent';
import LogBoxPolyfillDOM from './logbox-dom-polyfill';
import { getBaseUrl } from './utils/devServerEndpoints';
const Modal = RCTModalHostView;
const Colors = {
    background: '#111113',
};
const NativeExpoGoModule = (() => {
    try {
        return requireNativeModule('ExpoGo');
    }
    catch {
        return null;
    }
})();
function isRunningInExpoGo() {
    return NativeExpoGoModule != null;
}
function LogBoxRNPolyfill(props) {
    const logs = React.useMemo(() => {
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
    const [open, setOpen] = React.useState(true);
    const bundledLogBoxUrl = getBundledLogBoxURL();
    const closeModal = (cb) => {
        setOpen(false);
        setTimeout(cb, Platform.select({
            ios: 500, // To allow the native modal to slide away before unmounting
            default: 0, // Android has no animation, Web has css animation which doesn't require the delay
        }));
    };
    const onMinimize = () => closeModal(props.onMinimize);
    const onDismiss = props.onDismiss;
    const LogBoxWrapper = useMemo(() => Platform.OS === 'ios'
        ? ({ children, open }) => {
            return (_jsx(Modal, { animationType: "slide", presentationStyle: "pageSheet", visible: open, onRequestClose: onMinimize, children: children }));
        }
        : ({ children }) => _jsx(_Fragment, { children: children }), []);
    return (_jsx(LogBoxWrapper, { open: open, children: _jsx(View, { style: {
                backgroundColor: Platform.select({ default: undefined, ios: Colors.background }),
                pointerEvents: 'box-none',
                top: 0,
                flex: 1,
            }, collapsable: false, children: _jsx(LogBoxPolyfillDOM, { selectedIndex: props.selectedIndex, logs: logs, 
                // LogBoxData actions props
                onDismiss: onDismiss, onChangeSelectedIndex: props.onChangeSelectedIndex, 
                // Environment polyfill props
                devServerUrl: getBaseUrl(), 
                // Common actions props
                fetchTextAsync: async (input, init) => {
                    const res = await fetch(input, init);
                    return res.text();
                }, 
                // LogBox UI actions props
                onMinimize: onMinimize, onReload: () => {
                    // NOTE: For iOS only the reload is enough, but on Android the app gets stuck on an empty black screen
                    onMinimize();
                    setTimeout(() => {
                        DevSettings.reload();
                    }, 100);
                }, onCopyText: (text) => {
                    Clipboard.setString(text);
                }, 
                // DOM props
                dom: {
                    useExpoDOMWebView: true,
                    overrideUri: bundledLogBoxUrl ?? undefined,
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
                } }) }) }));
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
    return (_jsx(LogBoxRNPolyfill, { onDismiss: handleDismiss, onMinimize: handleMinimize, onChangeSelectedIndex: handleSetSelectedLog, logs: logs, selectedIndex: selectedLogIndex }));
}
let cachedBundledLogBoxUrl = undefined;
/**
 * Get the base URL for the Expo LogBox Prebuilt DOM Component HTML
 */
function getBundledLogBoxURL() {
    if (cachedBundledLogBoxUrl !== undefined) {
        return cachedBundledLogBoxUrl;
    }
    if (isRunningInExpoGo()) {
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
export default LogBoxData.withSubscription(LogBoxInspectorContainer);
//# sourceMappingURL=logbox-rn-polyfill.js.map