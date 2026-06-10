/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogBoxInspectorSourceMapStatus = LogBoxInspectorSourceMapStatus;
const react_1 = __importDefault(require("react"));
const LogBoxInspectorSourceMapStatus_module_css_1 = __importDefault(require("./LogBoxInspectorSourceMapStatus.module.css"));
function AlertTriangleIcon({ color, className }) {
    return (react_1.default.createElement("svg", { className: className, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        react_1.default.createElement("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }),
        react_1.default.createElement("line", { x1: "12", y1: "9", x2: "12", y2: "13" }),
        react_1.default.createElement("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })));
}
function LoaderIcon({ color, className }) {
    return (react_1.default.createElement("svg", { className: className, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        react_1.default.createElement("line", { x1: "12", y1: "2", x2: "12", y2: "6" }),
        react_1.default.createElement("line", { x1: "12", y1: "18", x2: "12", y2: "22" }),
        react_1.default.createElement("line", { x1: "4.93", y1: "4.93", x2: "7.76", y2: "7.76" }),
        react_1.default.createElement("line", { x1: "16.24", y1: "16.24", x2: "19.07", y2: "19.07" }),
        react_1.default.createElement("line", { x1: "2", y1: "12", x2: "6", y2: "12" }),
        react_1.default.createElement("line", { x1: "18", y1: "12", x2: "22", y2: "12" }),
        react_1.default.createElement("line", { x1: "4.93", y1: "19.07", x2: "7.76", y2: "16.24" }),
        react_1.default.createElement("line", { x1: "16.24", y1: "7.76", x2: "19.07", y2: "4.93" })));
}
function LogBoxInspectorSourceMapStatus(props) {
    let icon;
    let color;
    switch (props.status) {
        case 'FAILED':
            color = `rgba(243, 83, 105, 1)`;
            icon = react_1.default.createElement(AlertTriangleIcon, { color: color, className: LogBoxInspectorSourceMapStatus_module_css_1.default.image });
            break;
        case 'PENDING':
            color = `rgba(250, 186, 48, 1)`;
            icon = react_1.default.createElement(LoaderIcon, { color: color, className: `${LogBoxInspectorSourceMapStatus_module_css_1.default.image} ${LogBoxInspectorSourceMapStatus_module_css_1.default.spinner}` });
            break;
    }
    if (props.status === 'COMPLETE' || icon == null) {
        return null;
    }
    const content = (react_1.default.createElement(react_1.default.Fragment, null,
        icon,
        react_1.default.createElement("span", { className: LogBoxInspectorSourceMapStatus_module_css_1.default.text, style: { color } }, "Source Map")));
    if (props.onPress == null) {
        return react_1.default.createElement("div", { className: LogBoxInspectorSourceMapStatus_module_css_1.default.root }, content);
    }
    return (react_1.default.createElement("button", { className: LogBoxInspectorSourceMapStatus_module_css_1.default.root, onClick: props.onPress }, content));
}
//# sourceMappingURL=LogBoxInspectorSourceMapStatus.js.map