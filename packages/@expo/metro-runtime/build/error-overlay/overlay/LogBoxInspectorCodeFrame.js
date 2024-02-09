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
exports.LogBoxInspectorCodeFrame = void 0;
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const LogBoxInspectorSection_1 = require("./LogBoxInspectorSection");
const AnsiHighlight_1 = require("../UI/AnsiHighlight");
const LogBoxButton_1 = require("../UI/LogBoxButton");
const LogBoxStyle = __importStar(require("../UI/LogBoxStyle"));
const constants_1 = require("../UI/constants");
const formatProjectFilePath_1 = require("../formatProjectFilePath");
const openFileInEditor_1 = __importDefault(require("../modules/openFileInEditor"));
function LogBoxInspectorCodeFrame({ codeFrame }) {
    if (codeFrame == null) {
        return null;
    }
    function getFileName() {
        return (0, formatProjectFilePath_1.formatProjectFilePath)(process.env.EXPO_PROJECT_ROOT, codeFrame?.fileName);
    }
    function getLocation() {
        const location = codeFrame?.location;
        if (location != null) {
            return ` (${location.row}:${location.column + 1 /* Code frame columns are zero indexed */})`;
        }
        return null;
    }
    return (react_1.default.createElement(LogBoxInspectorSection_1.LogBoxInspectorSection, { heading: "Source" },
        react_1.default.createElement(react_native_1.View, { style: styles.box },
            react_1.default.createElement(react_native_1.View, { style: styles.frame },
                react_1.default.createElement(react_native_1.ScrollView, { horizontal: true },
                    react_1.default.createElement(AnsiHighlight_1.Ansi, { style: styles.content, text: codeFrame.content }))),
            react_1.default.createElement(LogBoxButton_1.LogBoxButton, { backgroundColor: {
                    default: 'transparent',
                    pressed: LogBoxStyle.getBackgroundDarkColor(1),
                }, style: styles.button, onPress: () => {
                    (0, openFileInEditor_1.default)(codeFrame.fileName, codeFrame.location?.row ?? 0);
                } },
                react_1.default.createElement(react_native_1.Text, { style: styles.fileText },
                    getFileName(),
                    getLocation())))));
}
exports.LogBoxInspectorCodeFrame = LogBoxInspectorCodeFrame;
const styles = react_native_1.StyleSheet.create({
    box: {
        backgroundColor: LogBoxStyle.getBackgroundColor(),
        borderWidth: 1,
        borderColor: '#323232',
        marginLeft: 10,
        marginRight: 10,
        marginTop: 5,
        borderRadius: 3,
    },
    frame: {
        padding: 10,
        borderBottomColor: LogBoxStyle.getTextColor(0.1),
        borderBottomWidth: 1,
    },
    button: {
        paddingTop: 10,
        paddingBottom: 10,
    },
    content: {
        color: LogBoxStyle.getTextColor(1),
        fontSize: 12,
        includeFontPadding: false,
        lineHeight: 20,
        fontFamily: constants_1.CODE_FONT,
    },
    fileText: {
        userSelect: 'none',
        color: LogBoxStyle.getTextColor(0.5),
        textAlign: 'center',
        flex: 1,
        fontSize: 16,
        includeFontPadding: false,
        fontFamily: constants_1.CODE_FONT,
    },
});
//# sourceMappingURL=LogBoxInspectorCodeFrame.js.map