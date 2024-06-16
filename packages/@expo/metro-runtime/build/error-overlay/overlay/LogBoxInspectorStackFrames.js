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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogBoxInspectorStackFrames = exports.getCollapseMessage = void 0;
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const LogBoxInspectorSection_1 = require("./LogBoxInspectorSection");
const LogBoxInspectorSourceMapStatus_1 = require("./LogBoxInspectorSourceMapStatus");
const LogBoxInspectorStackFrame_1 = require("./LogBoxInspectorStackFrame");
const LogContext_1 = require("../Data/LogContext");
const LogBoxButton_1 = require("../UI/LogBoxButton");
const LogBoxStyle = __importStar(require("../UI/LogBoxStyle"));
const openFileInEditor_1 = __importDefault(require("../modules/openFileInEditor"));
function getCollapseMessage(stackFrames, collapsed) {
    if (stackFrames.length === 0) {
        return 'No frames to show';
    }
    const collapsedCount = stackFrames.reduce((count, { collapse }) => {
        if (collapse === true) {
            return count + 1;
        }
        return count;
    }, 0);
    if (collapsedCount === 0) {
        return 'Showing all frames';
    }
    const framePlural = `frame${collapsedCount > 1 ? 's' : ''}`;
    if (collapsedCount === stackFrames.length) {
        return collapsed
            ? `See${collapsedCount > 1 ? ' all ' : ' '}${collapsedCount} collapsed ${framePlural}`
            : `Collapse${collapsedCount > 1 ? ' all ' : ' '}${collapsedCount} ${framePlural}`;
    }
    else {
        return collapsed
            ? `See ${collapsedCount} more ${framePlural}`
            : `Collapse ${collapsedCount} ${framePlural}`;
    }
}
exports.getCollapseMessage = getCollapseMessage;
function LogBoxInspectorStackFrames({ onRetry, type }) {
    const log = (0, LogContext_1.useSelectedLog)();
    const [collapsed, setCollapsed] = (0, react_1.useState)(() => {
        // Only collapse frames initially if some frames are not collapsed.
        return log.getAvailableStack(type)?.some(({ collapse }) => !collapse);
    });
    function getStackList() {
        if (collapsed === true) {
            return log.getAvailableStack(type)?.filter(({ collapse }) => !collapse);
        }
        else {
            return log.getAvailableStack(type);
        }
    }
    if (log.getAvailableStack(type)?.length === 0) {
        return null;
    }
    return (react_1.default.createElement(LogBoxInspectorSection_1.LogBoxInspectorSection, { heading: type === 'component' ? 'Component Stack' : 'Call Stack', action: react_1.default.createElement(LogBoxInspectorSourceMapStatus_1.LogBoxInspectorSourceMapStatus, { onPress: log.symbolicated[type].status === 'FAILED' ? onRetry : null, status: log.symbolicated[type].status }) },
        log.symbolicated[type].status !== 'COMPLETE' && (react_1.default.createElement(react_native_1.View, { style: stackStyles.hintBox },
            react_1.default.createElement(react_native_1.Text, { style: stackStyles.hintText }, "This call stack is not symbolicated. Some features are unavailable such as viewing the function name or tapping to open files."))),
        react_1.default.createElement(StackFrameList, { list: getStackList(), status: log.symbolicated[type].status }),
        react_1.default.createElement(StackFrameFooter, { onPress: () => setCollapsed(!collapsed), message: getCollapseMessage(log.getAvailableStack(type), !!collapsed) })));
}
exports.LogBoxInspectorStackFrames = LogBoxInspectorStackFrames;
function StackFrameList({ list, status, }) {
    return list.map((frame, index) => {
        const { file, lineNumber } = frame;
        return (react_1.default.createElement(LogBoxInspectorStackFrame_1.LogBoxInspectorStackFrame, { key: index, frame: frame, onPress: status === 'COMPLETE' && file != null && lineNumber != null
                ? () => (0, openFileInEditor_1.default)(file, lineNumber)
                : undefined }));
    });
}
function StackFrameFooter({ message, onPress }) {
    return (react_1.default.createElement(react_native_1.View, { style: stackStyles.collapseContainer },
        react_1.default.createElement(LogBoxButton_1.LogBoxButton, { backgroundColor: {
                default: 'transparent',
                pressed: LogBoxStyle.getBackgroundColor(1),
            }, onPress: onPress, style: stackStyles.collapseButton },
            react_1.default.createElement(react_native_1.Text, { style: stackStyles.collapse }, message))));
}
const stackStyles = react_native_1.StyleSheet.create({
    section: {
        marginTop: 15,
    },
    heading: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 12,
        marginBottom: 10,
    },
    headingText: {
        color: LogBoxStyle.getTextColor(1),
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        includeFontPadding: false,
        lineHeight: 20,
    },
    body: {
        paddingBottom: 10,
    },
    bodyText: {
        color: LogBoxStyle.getTextColor(1),
        fontSize: 14,
        includeFontPadding: false,
        lineHeight: 18,
        fontWeight: '500',
        paddingHorizontal: 27,
    },
    hintText: {
        color: LogBoxStyle.getTextColor(0.7),
        fontSize: 13,
        includeFontPadding: false,
        lineHeight: 18,
        fontWeight: '400',
        marginHorizontal: 10,
    },
    hintBox: {
        backgroundColor: LogBoxStyle.getBackgroundColor(),
        marginHorizontal: 10,
        paddingHorizontal: 5,
        paddingVertical: 10,
        borderRadius: 5,
        marginBottom: 5,
    },
    collapseContainer: {
        marginLeft: 15,
        flexDirection: 'row',
    },
    collapseButton: {
        borderRadius: 5,
    },
    collapse: {
        color: LogBoxStyle.getTextColor(0.7),
        fontSize: 12,
        fontWeight: '300',
        lineHeight: 20,
        marginTop: 0,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
});
//# sourceMappingURL=LogBoxInspectorStackFrames.js.map