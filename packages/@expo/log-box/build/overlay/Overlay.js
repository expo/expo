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
exports.LogBoxInspectorContainer = LogBoxInspectorContainer;
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const react_1 = __importStar(require("react"));
const CodeFrame_1 = require("./CodeFrame");
const Message_1 = require("./Message");
const Overlay_module_css_1 = __importDefault(require("./Overlay.module.css"));
const ContextActions_1 = require("../ContextActions");
const ContextPlatform_1 = require("../ContextPlatform");
const Constants_1 = require("./Constants");
const Header_1 = require("./Header");
const ShowMoreButton_1 = __importDefault(require("./ShowMoreButton"));
const StackTraceList_1 = require("./StackTraceList");
const LogBoxData = __importStar(require("../Data/LogBoxData"));
const LogBoxLog_1 = require("../Data/LogBoxLog");
const classNames_1 = require("../utils/classNames");
const devServerEndpoints_1 = require("../utils/devServerEndpoints");
require("../Global.css");
const ContextDevServer_1 = require("../ContextDevServer");
const HEADER_TITLE_MAP = {
    error: 'Console Error',
    fatal: 'Uncaught Error',
    resolution: 'Resolution Error',
    syntax: 'Build Error',
    static: 'Server Error',
};
function LogBoxInspectorContainer() {
    const { selectedLogIndex, logs } = (0, LogBoxLog_1.useLogs)();
    const log = logs[selectedLogIndex];
    if (log == null) {
        return null;
    }
    return (react_1.default.createElement(ContextDevServer_1.DevServerProvider, null,
        react_1.default.createElement(LogBoxInspector, { log: log, selectedLogIndex: selectedLogIndex, logs: logs })));
}
function LogBoxInspector({ log, selectedLogIndex, logs, }) {
    const { platform, isNative } = (0, ContextPlatform_1.useRuntimePlatform)();
    const { onMinimize: onMinimizeAction } = (0, ContextActions_1.useActions)();
    const isDismissable = !['static', 'syntax', 'resolution'].includes(log.level);
    const [closing, setClosing] = (0, react_1.useState)(false);
    const animateClose = (callback) => {
        setClosing(true);
        setTimeout(() => {
            callback();
        }, 200);
    };
    const onMinimize = (0, react_1.useCallback)((cb) => {
        if (isNative) {
            onMinimizeAction?.();
            cb?.();
        }
        else {
            animateClose(() => {
                onMinimizeAction?.();
                console.log('onMinimizeAction called', typeof cb);
                cb?.();
            });
        }
    }, [onMinimizeAction]);
    return (react_1.default.createElement("div", { className: [
            Overlay_module_css_1.default.overlay,
            platform === 'ios' ? Overlay_module_css_1.default.overlayIos : null,
            platform === 'android' ? Overlay_module_css_1.default.overlayAndroid : null,
            platform === 'web' ? Overlay_module_css_1.default.overlayWeb : null,
        ]
            .filter(Boolean)
            .join(' ') },
        react_1.default.createElement("div", { "data-expo-log-backdrop": "true", className: platform === 'web' ? `${Overlay_module_css_1.default.bg} ${closing ? Overlay_module_css_1.default.bgExit : ''}` : undefined, onClick: () => {
                if (isDismissable) {
                    onMinimize();
                }
            } }),
        react_1.default.createElement("div", { className: (0, classNames_1.classNames)(Overlay_module_css_1.default.container, platform !== 'android' && Overlay_module_css_1.default.containerTopRadius, closing && Overlay_module_css_1.default.containerExit) },
            react_1.default.createElement(LogBoxContent, { log: log, selectedLogIndex: selectedLogIndex, logs: logs, isDismissable: isDismissable, onMinimize: onMinimize }))));
}
function LogBoxContent({ log, selectedLogIndex, logs, isDismissable, onMinimize, }) {
    const { projectRoot, sdkVersion } = (0, ContextDevServer_1.useDevServer)();
    const onDismiss = () => {
        // Here we handle the cases when the log is dismissed and it
        // was either the last log, or when the current index
        // is now outside the bounds of the log array.
        if (selectedLogIndex != null) {
            if (logs.length - 1 <= 0) {
                onMinimize(() => {
                    LogBoxData.dismiss(logs[selectedLogIndex]);
                });
            }
            else if (selectedLogIndex >= logs.length - 1) {
                LogBoxData.setSelectedLog(selectedLogIndex - 1);
                LogBoxData.dismiss(logs[selectedLogIndex]);
            }
        }
    };
    const onChangeSelectedIndex = (0, react_1.useCallback)((index) => {
        LogBoxData.setSelectedLog(index);
    }, []);
    (0, react_1.useEffect)(() => {
        if (log) {
            LogBoxData.symbolicateLogNow('stack', log);
            LogBoxData.symbolicateLogNow('component', log);
        }
    }, [log]);
    (0, react_1.useEffect)(() => {
        // Optimistically symbolicate the last and next logs.
        if (logs.length > 1) {
            const selected = selectedLogIndex;
            const lastIndex = logs.length - 1;
            const prevIndex = selected - 1 < 0 ? lastIndex : selected - 1;
            const nextIndex = selected + 1 > lastIndex ? 0 : selected + 1;
            for (const type of ['component', 'stack']) {
                LogBoxData.symbolicateLogLazy(type, logs[prevIndex]);
                LogBoxData.symbolicateLogLazy(type, logs[nextIndex]);
            }
        }
    }, [logs, selectedLogIndex]);
    const _handleRetry = (0, react_1.useCallback)((type) => {
        LogBoxData.retrySymbolicateLogNow(type, log);
    }, [log]);
    // @ts-ignore
    const onReload = globalThis.__polyfill_dom_reloadRuntime;
    const onCopy = () => {
        // Copy log to clipboard
        const errContents = [log.message.content.trim()];
        const componentStack = log.getAvailableStack('component');
        if (componentStack?.length) {
            errContents.push('', 'Component Stack', (0, devServerEndpoints_1.getFormattedStackTrace)(projectRoot ?? '', componentStack));
        }
        const stackTrace = log.getAvailableStack('stack');
        if (stackTrace?.length) {
            errContents.push('', 'Call Stack', (0, devServerEndpoints_1.getFormattedStackTrace)(projectRoot ?? '', stackTrace));
        }
        // @ts-ignore
        if (typeof __polyfill_onCopyText === 'function') {
            // @ts-ignore
            __polyfill_onCopyText(errContents.join('\n'));
        }
        else {
            // Fallback to the default copy function
            navigator.clipboard.writeText(errContents.join('\n'));
        }
    };
    const [collapsed, setCollapsed] = (0, react_1.useState)(true);
    const headerTitle = HEADER_TITLE_MAP[log.level] ?? log.type;
    const headerBlurRef = react_1.default.useRef(null);
    const scrollRef = react_1.default.useRef(null);
    // Transition the opacity of the header blur when the scroll position changes.
    (0, react_1.useEffect)(() => {
        const scrollElement = scrollRef.current;
        const headerBlurElement = headerBlurRef.current;
        if (scrollElement && headerBlurElement) {
            const handleScroll = () => {
                const scrollTop = scrollElement.scrollTop;
                const opacity = Math.min(scrollTop / 16, 1);
                headerBlurElement.style.opacity = `${opacity}`;
            };
            scrollElement.addEventListener('scroll', handleScroll);
            return () => {
                scrollElement.removeEventListener('scroll', handleScroll);
            };
        }
        return () => { };
    }, [scrollRef, headerBlurRef]);
    let codeFrames = log?.codeFrame
        ? Object.entries(log.codeFrame).filter(([, value]) => value?.content)
        : [];
    codeFrames = uniqueBy(uniqueBy(codeFrames, ([, value]) => {
        return [value.fileName, value.location?.column, value.location?.row].join(':');
    }), ([, value]) => {
        return value?.content;
    });
    return (react_1.default.createElement("div", { className: Overlay_module_css_1.default.content },
        react_1.default.createElement("div", { className: Overlay_module_css_1.default.headerBlur, ref: headerBlurRef }),
        react_1.default.createElement("div", { style: {
                position: 'sticky',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1,
                backgroundColor: 'var(--expo-log-color-background)',
            } },
            react_1.default.createElement(Header_1.ErrorOverlayHeader, { sdkVersion: sdkVersion, selectedIndex: selectedLogIndex, total: logs.length, isDismissable: isDismissable, onDismiss: onDismiss, onMinimize: () => onMinimize(), onSelectIndex: onChangeSelectedIndex, level: log.level, onCopy: onCopy, onReload: onReload })),
        react_1.default.createElement("div", { className: Overlay_module_css_1.default.scroll, ref: scrollRef },
            react_1.default.createElement(ErrorMessageHeader, { collapsed: collapsed, onPress: () => setCollapsed(!collapsed), message: log.message, level: log.level, title: headerTitle }),
            react_1.default.createElement("div", { style: { padding: '0 1rem', gap: 10, display: 'flex', flexDirection: 'column' } },
                codeFrames.map(([key, codeFrame]) => (react_1.default.createElement(CodeFrame_1.ErrorCodeFrame, { key: key, projectRoot: projectRoot, codeFrame: codeFrame }))),
                log.isMissingModuleError && (react_1.default.createElement(InstallMissingModuleTerminal, { moduleName: log.isMissingModuleError })),
                !!log?.componentStack?.length && (react_1.default.createElement(StackTraceList_1.StackTraceList, { key: selectedLogIndex + '-component-stack', type: "component", stack: log.getAvailableStack('component'), symbolicationStatus: log.getStackStatus('component'), 
                    // eslint-disable-next-line react/jsx-no-bind
                    onRetry: _handleRetry.bind(_handleRetry, 'component') })),
                react_1.default.createElement(StackTraceList_1.StackTraceList, { key: selectedLogIndex + '-stack', type: "stack", stack: log.getAvailableStack('stack'), symbolicationStatus: log.getStackStatus('stack'), 
                    // eslint-disable-next-line react/jsx-no-bind
                    onRetry: _handleRetry.bind(_handleRetry, 'stack') })),
            !isDismissable && (react_1.default.createElement(ErrorOverlayFooter, { message: "Build-time errors can only be dismissed by fixing the issue." })))));
}
function InstallMissingModuleTerminal({ moduleName, }) {
    return react_1.default.createElement(CodeFrame_1.Terminal, { moduleName: moduleName, content: `$ npx expo install ${moduleName}` });
}
function uniqueBy(array, key) {
    const seen = new Set();
    return array.filter((item) => {
        const k = key(item);
        if (seen.has(k)) {
            return false;
        }
        seen.add(k);
        return true;
    });
}
function ErrorOverlayFooter({ message }) {
    return (react_1.default.createElement("div", { className: Overlay_module_css_1.default.footer },
        react_1.default.createElement("footer", { style: {
                padding: '1rem',
                flex: 1,
                borderTop: `1px solid var(--expo-log-color-border)`,
            } },
            react_1.default.createElement("span", { style: {
                    color: 'var(--expo-log-secondary-label)',
                    fontSize: '0.875rem',
                    fontFamily: 'var(--expo-log-font-family)',
                } }, message))));
}
function ErrorMessageHeader(props) {
    return (react_1.default.createElement("div", { style: {
            padding: '0 1rem',
            display: 'flex',
            gap: 8,
            flexDirection: 'column',
        } },
        react_1.default.createElement("div", { style: { display: 'flex' } },
            react_1.default.createElement("span", { "data-testid": "logbox_title", style: {
                    fontFamily: 'var(--expo-log-font-family)',
                    padding: 8,
                    marginLeft: -4,
                    backgroundColor: 'rgba(205, 97, 94, 0.2)',
                    borderRadius: 8,
                    fontWeight: '600',
                    fontSize: 14,
                    color: `var(--expo-log-color-danger)`,
                } }, props.title)),
        react_1.default.createElement("span", { style: {
                color: 'var(--expo-log-color-label)',
                fontFamily: 'var(--expo-log-font-family)',
                fontSize: 16,
                whiteSpace: 'pre-wrap',
                fontWeight: '500',
                wordBreak: 'normal',
            } },
            react_1.default.createElement(Message_1.LogBoxMessage, { maxLength: props.collapsed ? Constants_1.SHOW_MORE_MESSAGE_LENGTH : Infinity, message: props.message }),
            react_1.default.createElement(ShowMoreButton_1.default, { ...props }))));
}
