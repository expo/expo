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
exports.LogBoxInspectorSection = void 0;
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const LogBoxStyle = __importStar(require("../UI/LogBoxStyle"));
function LogBoxInspectorSection(props) {
    return (react_1.default.createElement(react_native_1.View, { style: styles.section },
        react_1.default.createElement(react_native_1.View, { style: styles.heading },
            react_1.default.createElement(react_native_1.Text, { style: styles.headingText }, props.heading),
            props.action),
        react_1.default.createElement(react_native_1.View, { style: styles.body }, props.children)));
}
exports.LogBoxInspectorSection = LogBoxInspectorSection;
const styles = react_native_1.StyleSheet.create({
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
        fontSize: 18,
        fontWeight: '600',
        includeFontPadding: false,
        lineHeight: 20,
    },
    body: {
        paddingBottom: 10,
    },
});
//# sourceMappingURL=LogBoxInspectorSection.js.map