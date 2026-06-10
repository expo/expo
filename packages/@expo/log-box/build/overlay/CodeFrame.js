import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Copyright (c) 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect } from 'react';
import { Ansi } from './AnsiHighlight';
import styles from './CodeFrame.module.css';
import { formatProjectFilePath, openFileInEditor } from '../utils/devServerEndpoints';
export function ErrorCodeFrame({ showPathsRelativeTo, codeFrame, }) {
    if (codeFrame == null) {
        return null;
    }
    function getFileName() {
        return formatProjectFilePath(showPathsRelativeTo, codeFrame?.fileName);
    }
    function getLocation() {
        const location = codeFrame?.location;
        if (location != null) {
            return ` (${location.row}:${location.column + 1 /* Code frame columns are zero indexed */})`;
        }
        return null;
    }
    return (_jsx(CodeFrame, { title: _jsxs(_Fragment, { children: [getFileName(), _jsx("span", { style: { opacity: 0.8 }, children: getLocation() })] }), headerIcon: _jsx(FileIcon, {}), headerAction: _jsxs("button", { className: styles.copyButton, type: "button", title: "Open in editor", onClick: () => {
                openFileInEditor(codeFrame.fileName, codeFrame.location?.row ?? 0);
            }, "aria-label": "Copy content", children: [_jsx("p", { className: styles.copyButtonText, "data-text": "true", children: "Open" }), _jsx(OpenIcon, { className: styles.copyButtonIcon, width: 26, height: 26 })] }), content: codeFrame.content }));
}
export function Terminal({ content, moduleName }) {
    return (_jsx(CodeFrame, { title: "Terminal", 
        // TODO: change to copy button
        // headerAction={
        //   <button
        //     className={styles.copyButton}
        //     type="button"
        //     title="Run command in project"
        //     onClick={() => {
        //     }}
        //     aria-label="Copy content">
        //     <p className={styles.copyButtonText} data-text="true">
        //       Run
        //     </p>
        //     <PlayIcon className={styles.copyButtonIcon} width={26} height={26} />
        //   </button>
        // }
        headerIcon: _jsx(TerminalIcon, {}), content: content }));
}
function CodeFrame({ content, headerIcon, headerAction, title, }) {
    const leftBlurRef = React.useRef(null);
    const scrollTextRef = React.useRef(null);
    // Transition the opacity of the header blur when the scroll position changes.
    useEffect(() => {
        const scrollElement = scrollTextRef.current;
        const leftBlurElement = leftBlurRef.current;
        if (scrollElement == null || leftBlurElement == null) {
            return;
        }
        const handleScroll = () => {
            leftBlurElement.style.opacity = String(scrollElement.scrollLeft / 20);
        };
        scrollElement.addEventListener('scroll', handleScroll);
        return () => {
            scrollElement.removeEventListener('scroll', handleScroll);
        };
    }, [scrollTextRef, leftBlurRef]);
    // Scroll to end of the text when it changes
    useEffect(() => {
        const scrollElement = scrollTextRef.current;
        if (scrollElement == null) {
            return;
        }
        scrollElement.scrollTo({
            left: scrollElement.scrollWidth,
            behavior: 'smooth',
        });
    }, [scrollTextRef, content]);
    // Try to match the Expo docs
    return (_jsxs("div", { style: {
            backgroundColor: 'var(--expo-log-secondary-system-grouped-background)',
            border: '1px solid var(--expo-log-color-border)',
            marginTop: 5,
            borderRadius: 6,
        }, children: [_jsxs("header", { className: styles.header, children: [_jsxs("span", { style: {
                            display: 'flex',
                            width: '100%',
                            position: 'relative',
                            overflowX: 'hidden',
                        }, children: [_jsxs("span", { ref: scrollTextRef, className: styles.headerScrollText, children: [_jsx("span", { className: styles.headerIconWrapper, style: {}, children: headerIcon }), _jsx("span", { className: styles.headerText, children: title })] }), _jsx("span", { ref: leftBlurRef, className: styles.blurGradientLR }), _jsx("span", { className: styles.blurGradientRL })] }), headerAction] }), _jsx("div", { style: {
                    padding: 10,
                    display: 'flex',
                    flexDirection: 'column',
                }, children: _jsx("div", { style: {
                        overflowX: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                    }, children: content && (_jsx(Ansi, { style: {
                            flexDirection: 'column',
                            color: 'var(--expo-log-color-label)',
                            fontSize: 12,
                            lineHeight: '20px',
                            fontFamily: 'var(--expo-log-font-mono)',
                        }, text: content })) }) })] }));
}
function OpenIcon(props) {
    return (_jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", ...props, role: "img", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M7 17L17 7M17 7H7M17 7V17" }) }));
}
export function FileIcon() {
    return (_jsx("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", style: {
            width: '1rem',
            height: '1rem',
            color: 'var(--expo-log-secondary-label)',
        }, className: styles.fileIcon, role: "img", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M14 2.26953V6.40007C14 6.96012 14 7.24015 14.109 7.45406C14.2049 7.64222 14.3578 7.7952 14.546 7.89108C14.7599 8.00007 15.0399 8.00007 15.6 8.00007H19.7305M14 17.5L16.5 15L14 12.5M10 12.5L7.5 15L10 17.5M20 9.98822V17.2C20 18.8802 20 19.7202 19.673 20.362C19.3854 20.9265 18.9265 21.3854 18.362 21.673C17.7202 22 16.8802 22 15.2 22H8.8C7.11984 22 6.27976 22 5.63803 21.673C5.07354 21.3854 4.6146 20.9265 4.32698 20.362C4 19.7202 4 18.8802 4 17.2V6.8C4 5.11984 4 4.27976 4.32698 3.63803C4.6146 3.07354 5.07354 2.6146 5.63803 2.32698C6.27976 2 7.11984 2 8.8 2H12.0118C12.7455 2 13.1124 2 13.4577 2.08289C13.7638 2.15638 14.0564 2.27759 14.3249 2.44208C14.6276 2.6276 14.887 2.88703 15.4059 3.40589L18.5941 6.59411C19.113 7.11297 19.3724 7.3724 19.5579 7.67515C19.7224 7.94356 19.8436 8.2362 19.9171 8.5423C20 8.88757 20 9.25445 20 9.98822Z" }) }));
}
export function TerminalIcon() {
    return (_jsxs("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", style: {
            width: '1rem',
            height: '1rem',
            color: 'var(--expo-log-secondary-label)',
        }, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: styles.fileIcon, role: "img", children: [_jsx("polyline", { points: "4 17 10 11 4 5" }), _jsx("line", { x1: "12", x2: "20", y1: "19", y2: "19" })] }));
}
//# sourceMappingURL=CodeFrame.js.map