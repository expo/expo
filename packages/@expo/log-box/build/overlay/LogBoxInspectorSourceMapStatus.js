/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import styles from './LogBoxInspectorSourceMapStatus.module.css';
function AlertTriangleIcon({ color, className }) {
    return (_jsxs("svg", { className: className, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }), _jsx("line", { x1: "12", y1: "9", x2: "12", y2: "13" }), _jsx("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })] }));
}
function LoaderIcon({ color, className }) {
    return (_jsxs("svg", { className: className, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("line", { x1: "12", y1: "2", x2: "12", y2: "6" }), _jsx("line", { x1: "12", y1: "18", x2: "12", y2: "22" }), _jsx("line", { x1: "4.93", y1: "4.93", x2: "7.76", y2: "7.76" }), _jsx("line", { x1: "16.24", y1: "16.24", x2: "19.07", y2: "19.07" }), _jsx("line", { x1: "2", y1: "12", x2: "6", y2: "12" }), _jsx("line", { x1: "18", y1: "12", x2: "22", y2: "12" }), _jsx("line", { x1: "4.93", y1: "19.07", x2: "7.76", y2: "16.24" }), _jsx("line", { x1: "16.24", y1: "7.76", x2: "19.07", y2: "4.93" })] }));
}
export function LogBoxInspectorSourceMapStatus(props) {
    let icon;
    let color;
    switch (props.status) {
        case 'FAILED':
            color = `rgba(243, 83, 105, 1)`;
            icon = _jsx(AlertTriangleIcon, { color: color, className: styles.image });
            break;
        case 'PENDING':
            color = `rgba(250, 186, 48, 1)`;
            icon = _jsx(LoaderIcon, { color: color, className: `${styles.image} ${styles.spinner}` });
            break;
    }
    if (props.status === 'COMPLETE' || icon == null) {
        return null;
    }
    const content = (_jsxs(_Fragment, { children: [icon, _jsx("span", { className: styles.text, style: { color }, children: "Source Map" })] }));
    if (props.onPress == null) {
        return _jsx("div", { className: styles.root, children: content });
    }
    return (_jsx("button", { className: styles.root, onClick: props.onPress, children: content }));
}
//# sourceMappingURL=LogBoxInspectorSourceMapStatus.js.map