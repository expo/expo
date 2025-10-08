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
exports.ErrorCodeFrame = ErrorCodeFrame;
exports.Terminal = Terminal;
exports.CodeFrame = CodeFrame;
exports.FileIcon = FileIcon;
exports.TerminalIcon = TerminalIcon;
/**
 * Copyright (c) 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const AnsiHighlight_1 = require("./AnsiHighlight");
const CodeFrame_module_css_1 = __importDefault(require("./CodeFrame.module.css"));
const devServerEndpoints_1 = require("../utils/devServerEndpoints");
function ErrorCodeFrame({ projectRoot, codeFrame, }) {
    if (codeFrame == null) {
        return null;
    }
    function getFileName() {
        return (0, devServerEndpoints_1.formatProjectFilePath)(projectRoot ?? '', codeFrame?.fileName);
    }
    function getLocation() {
        const location = codeFrame?.location;
        if (location != null) {
            return ` (${location.row}:${location.column + 1 /* Code frame columns are zero indexed */})`;
        }
        return null;
    }
    return (react_1.default.createElement(CodeFrame, { title: react_1.default.createElement(react_1.default.Fragment, null,
            getFileName(),
            react_1.default.createElement("span", { style: { opacity: 0.8 } }, getLocation())), headerIcon: react_1.default.createElement(FileIcon, null), headerAction: react_1.default.createElement("button", { className: CodeFrame_module_css_1.default.copyButton, type: "button", title: "Open in editor", onClick: () => {
                (0, devServerEndpoints_1.openFileInEditor)(codeFrame.fileName, codeFrame.location?.row ?? 0);
            }, "aria-label": "Copy content" },
            react_1.default.createElement("p", { className: CodeFrame_module_css_1.default.copyButtonText, "data-text": "true" }, "Open"),
            react_1.default.createElement(OpenIcon, { className: CodeFrame_module_css_1.default.copyButtonIcon, width: 26, height: 26 })), content: codeFrame.content }));
}
function Terminal({ content, moduleName }) {
    return (react_1.default.createElement(CodeFrame, { title: "Terminal", headerAction: react_1.default.createElement("button", { className: CodeFrame_module_css_1.default.copyButton, type: "button", title: "Run command in project", onClick: () => {
                // TODO: Stream back progress
                (0, devServerEndpoints_1.installPackageInProject)(moduleName);
            }, "aria-label": "Copy content" },
            react_1.default.createElement("p", { className: CodeFrame_module_css_1.default.copyButtonText, "data-text": "true" }, "Run"),
            react_1.default.createElement(PlayIcon, { className: CodeFrame_module_css_1.default.copyButtonIcon, width: 26, height: 26 })), headerIcon: react_1.default.createElement(TerminalIcon, null), content: content }));
}
function CodeFrame({ content, headerIcon, headerAction, title, }) {
    const leftBlurRef = react_1.default.useRef(null);
    const scrollTextRef = react_1.default.useRef(null);
    // Transition the opacity of the header blur when the scroll position changes.
    (0, react_1.useEffect)(() => {
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
    (0, react_1.useEffect)(() => {
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
    return (react_1.default.createElement("div", { style: {
            backgroundColor: 'var(--expo-log-secondary-system-grouped-background)',
            border: '1px solid var(--expo-log-color-border)',
            marginTop: 5,
            borderRadius: 6,
        } },
        react_1.default.createElement("header", { className: CodeFrame_module_css_1.default.header },
            react_1.default.createElement("span", { style: {
                    display: 'flex',
                    width: '100%',
                    position: 'relative',
                    overflowX: 'hidden',
                } },
                react_1.default.createElement("span", { ref: scrollTextRef, className: CodeFrame_module_css_1.default.headerScrollText },
                    react_1.default.createElement("span", { className: CodeFrame_module_css_1.default.headerIconWrapper, style: {} }, headerIcon),
                    react_1.default.createElement("span", { className: CodeFrame_module_css_1.default.headerText }, title)),
                react_1.default.createElement("span", { ref: leftBlurRef, className: CodeFrame_module_css_1.default.blurGradientLR }),
                react_1.default.createElement("span", { className: CodeFrame_module_css_1.default.blurGradientRL })),
            headerAction),
        react_1.default.createElement("div", { style: {
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
            } },
            react_1.default.createElement(react_native_1.ScrollView, { horizontal: true, contentContainerStyle: {
                    flexDirection: 'column',
                } }, content && (react_1.default.createElement(AnsiHighlight_1.Ansi, { style: {
                    flexDirection: 'column',
                    color: 'var(--expo-log-color-label)',
                    fontSize: 12,
                    includeFontPadding: false,
                    lineHeight: 20,
                    fontFamily: 'var(--expo-log-font-mono)',
                }, text: content }))))));
}
function PlayIcon(props) {
    return (react_1.default.createElement("svg", { fill: "none", viewBox: "0 0 24 24", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", stroke: "currentColor", ...props, role: "img" },
        react_1.default.createElement("polygon", { points: "6 3 20 12 6 21 6 3" })));
}
function OpenIcon(props) {
    return (react_1.default.createElement("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", ...props, role: "img" },
        react_1.default.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M7 17L17 7M17 7H7M17 7V17" })));
}
function FileIcon() {
    return (react_1.default.createElement("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", style: {
            width: '1rem',
            height: '1rem',
            color: 'var(--expo-log-secondary-label)',
        }, className: CodeFrame_module_css_1.default.fileIcon, role: "img" },
        react_1.default.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M14 2.26953V6.40007C14 6.96012 14 7.24015 14.109 7.45406C14.2049 7.64222 14.3578 7.7952 14.546 7.89108C14.7599 8.00007 15.0399 8.00007 15.6 8.00007H19.7305M14 17.5L16.5 15L14 12.5M10 12.5L7.5 15L10 17.5M20 9.98822V17.2C20 18.8802 20 19.7202 19.673 20.362C19.3854 20.9265 18.9265 21.3854 18.362 21.673C17.7202 22 16.8802 22 15.2 22H8.8C7.11984 22 6.27976 22 5.63803 21.673C5.07354 21.3854 4.6146 20.9265 4.32698 20.362C4 19.7202 4 18.8802 4 17.2V6.8C4 5.11984 4 4.27976 4.32698 3.63803C4.6146 3.07354 5.07354 2.6146 5.63803 2.32698C6.27976 2 7.11984 2 8.8 2H12.0118C12.7455 2 13.1124 2 13.4577 2.08289C13.7638 2.15638 14.0564 2.27759 14.3249 2.44208C14.6276 2.6276 14.887 2.88703 15.4059 3.40589L18.5941 6.59411C19.113 7.11297 19.3724 7.3724 19.5579 7.67515C19.7224 7.94356 19.8436 8.2362 19.9171 8.5423C20 8.88757 20 9.25445 20 9.98822Z" })));
}
function TerminalIcon() {
    return (react_1.default.createElement("svg", { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", style: {
            width: '1rem',
            height: '1rem',
            color: 'var(--expo-log-secondary-label)',
        }, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: CodeFrame_module_css_1.default.fileIcon, role: "img" },
        react_1.default.createElement("polyline", { points: "4 17 10 11 4 5" }),
        react_1.default.createElement("line", { x1: "12", x2: "20", y1: "19", y2: "19" })));
}
