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
exports.StackTraceList = StackTraceList;
/**
 * Copyright (c) 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const LogBoxInspectorSourceMapStatus_1 = require("./LogBoxInspectorSourceMapStatus");
const StackTraceList_module_css_1 = __importDefault(require("./StackTraceList.module.css"));
const devServerEndpoints_1 = require("../utils/devServerEndpoints");
const ContextDevServer_1 = require("../ContextDevServer");
function Transition({ children, status, onExitComplete, isInitial, index, initialDelay = 50, }) {
    const ref = react_1.default.useRef(null);
    react_1.default.useLayoutEffect(() => {
        const element = ref.current;
        if (!element)
            return;
        if (isInitial && status === 'stable') {
            element.style.height = '0px';
            element.style.opacity = '0';
            setTimeout(() => {
                element.style.height = `${element.scrollHeight}px`;
                element.style.opacity = '1';
            }, index * initialDelay);
        }
        else if (status === 'entering') {
            element.style.height = '0px';
            element.style.opacity = '0';
            requestAnimationFrame(() => {
                element.style.height = `${element.scrollHeight}px`;
                element.style.opacity = '1';
            });
        }
        else if (status === 'exiting') {
            element.style.height = `${element.scrollHeight}px`;
            element.style.opacity = '1';
            requestAnimationFrame(() => {
                element.style.height = '0px';
                element.style.opacity = '0';
            });
        }
        else if (status === 'stable') {
            element.style.height = `${element.scrollHeight}px`;
            element.style.opacity = '1';
        }
    }, [status, isInitial, index]);
    react_1.default.useEffect(() => {
        if (status === 'exiting') {
            const handleTransitionEnd = (e) => {
                if (e.propertyName === 'height') {
                    onExitComplete();
                }
            };
            ref.current?.addEventListener('transitionend', handleTransitionEnd);
            return () => {
                ref.current?.removeEventListener('transitionend', handleTransitionEnd);
            };
        }
        return undefined;
    }, [status, onExitComplete]);
    return (react_1.default.createElement("div", { ref: ref, style: {
            overflow: 'hidden',
            transition: 'height 0.3s ease, opacity 0.3s ease',
        } }, children));
}
function List({ items, showCollapsed, isInitial, initialDelay, }) {
    const [displayItems, setDisplayItems] = react_1.default.useState(items.filter((item) => !item.isCollapsed).map((item) => ({ item, status: 'stable' })));
    react_1.default.useEffect(() => {
        const visibleItems = showCollapsed ? items : items.filter((item) => !item.isCollapsed);
        setDisplayItems((prev) => {
            const prevIds = new Set(prev.map((d) => d.item.id));
            const newItems = visibleItems
                .filter((item) => !prevIds.has(item.id))
                .map((item) => ({ item, status: 'entering' }));
            const updatedPrev = prev.map((d) => {
                if (!visibleItems.some((item) => item.id === d.item.id)) {
                    return { ...d, status: 'exiting' };
                }
                return d;
            });
            return [...updatedPrev, ...newItems];
        });
    }, [showCollapsed, items]);
    const onExitComplete = (id) => {
        setDisplayItems((prev) => prev.filter((d) => d.item.id !== id));
    };
    return (react_1.default.createElement("div", null, displayItems.map((d, index) => (react_1.default.createElement(Transition, { key: d.item.id, status: d.status, onExitComplete: () => onExitComplete(d.item.id), isInitial: isInitial, initialDelay: initialDelay, index: index }, d.item.content)))));
}
function useContainerWidth() {
    const [width, setWidth] = (0, react_1.useState)(0);
    const ref = react_1.default.useRef(null);
    react_1.default.useLayoutEffect(() => {
        if (ref.current) {
            setWidth(ref.current.clientWidth);
            const handleResize = () => {
                if (ref.current) {
                    setWidth(ref.current.clientWidth);
                }
            };
            window.addEventListener('resize', handleResize);
            return () => {
                window.removeEventListener('resize', handleResize);
            };
        }
        return undefined;
    }, [ref]);
    return { width, ref };
}
function StackTraceList({ onRetry, type, stack, symbolicationStatus, }) {
    const [collapsed, setCollapsed] = (0, react_1.useState)(true);
    const stackCount = stack?.length;
    const [isInitial, setIsInitial] = react_1.default.useState(true);
    const initialDelay = 50;
    const initialTimer = react_1.default.useRef(null);
    react_1.default.useEffect(() => {
        if (isInitial) {
            const visibleCount = stack?.filter((frame) => !frame.collapse).length ?? 0;
            initialTimer.current = setTimeout(() => setIsInitial(false), visibleCount * initialDelay + 500);
        }
        return () => {
            if (initialTimer.current) {
                clearTimeout(initialTimer.current);
                initialTimer.current = null;
            }
        };
    }, [isInitial]);
    const { width: containerWidth, ref } = useContainerWidth();
    if (!stackCount) {
        return null;
    }
    const collapseTitle = getCollapseMessage(stack, !!collapsed);
    return (react_1.default.createElement("div", { style: { marginTop: 5, display: 'flex', flexDirection: 'column', gap: 6 } },
        react_1.default.createElement("div", { ref: ref, style: {
                display: 'flex',
                alignItems: 'center',
                marginBottom: 4,
                justifyContent: 'space-between',
            } },
            react_1.default.createElement("div", { style: { display: 'flex', gap: 8, alignItems: 'center' } },
                type === 'component' ? (react_1.default.createElement(ReactIcon, { stroke: "unset", style: {
                        width: '1rem',
                        height: '1rem',
                        color: 'var(--expo-log-color-label)',
                    } })) : (react_1.default.createElement(JavaScriptIcon, { style: {
                        width: '1rem',
                        height: '1rem',
                        color: 'var(--expo-log-color-label)',
                    } })),
                react_1.default.createElement("h3", { style: {
                        fontFamily: 'var(--expo-log-font-family)',
                        color: 'var(--expo-log-color-label)',
                        fontSize: 18,
                        fontWeight: '600',
                        margin: 0,
                    } }, type === 'component' ? 'Component Stack' : 'Call Stack'),
                react_1.default.createElement("span", { "data-text": true, style: {
                        backgroundColor: 'rgba(234.6, 234.6, 244.8, 0.1)',
                        fontFamily: 'var(--expo-log-font-family)',
                        color: 'var(--expo-log-color-label)',
                        borderRadius: 50,
                        fontSize: 12,
                        aspectRatio: '1/1',
                        display: 'flex',
                        width: 22,
                        height: 22,
                        justifyContent: 'center',
                        alignItems: 'center',
                    } }, stackCount),
                react_1.default.createElement(LogBoxInspectorSourceMapStatus_1.LogBoxInspectorSourceMapStatus, { onPress: symbolicationStatus === 'FAILED' ? onRetry : null, status: symbolicationStatus })),
            react_1.default.createElement(react_native_1.Pressable, { onPress: () => setCollapsed(!collapsed) }, ({ 
            //@ts-expect-error fix rn-web typings
            hovered, }) => (react_1.default.createElement("div", { title: collapseTitle.full, style: {
                    padding: 6,
                    borderRadius: 8,
                    transition: 'background-color 0.3s',
                    outlineColor: 'transparent',
                    backgroundColor: hovered ? 'rgba(234.6, 234.6, 244.8, 0.1)' : undefined,
                    color: 'rgba(234.6, 234.6, 244.8, 0.6)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 2,
                    userSelect: 'none',
                    cursor: 'pointer',
                } },
                react_1.default.createElement("span", { className: StackTraceList_module_css_1.default.collapseTitle, style: {
                        fontFamily: 'var(--expo-log-font-family)',
                        fontSize: 14,
                        userSelect: 'none',
                        color: 'rgba(234.6, 234.6, 244.8, 0.6)',
                    } }, containerWidth > 440 ? collapseTitle.full : collapseTitle.short),
                react_1.default.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "md-hidden" }, collapsed ? (react_1.default.createElement(react_1.default.Fragment, null,
                    react_1.default.createElement("path", { d: "m7 15 5 5 5-5" }),
                    react_1.default.createElement("path", { d: "m7 9 5-5 5 5" }))) : (react_1.default.createElement(react_1.default.Fragment, null,
                    react_1.default.createElement("path", { d: "m7 20 5-5 5 5" }),
                    react_1.default.createElement("path", { d: "m7 4 5 5 5-5" })))))))),
        symbolicationStatus !== 'COMPLETE' && (react_1.default.createElement("div", { style: {
                backgroundColor: `var(--expo-log-secondary-system-background)`,
                border: `1px solid var(--expo-log-color-border)`,
                padding: `10px 15px`,
                borderRadius: 5,
            } },
            react_1.default.createElement("span", { style: {
                    fontFamily: 'var(--expo-log-font-family)',
                    color: 'var(--expo-log-color-label)',
                    opacity: 0.7,
                    fontSize: 13,
                    fontWeight: '400',
                } }, "This call stack is not symbolicated. Some features are unavailable such as viewing the function name or tapping to open files."))),
        react_1.default.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 2 } },
            react_1.default.createElement(List, { initialDelay: initialDelay, 
                // @ts-ignore TODO: fix types
                items: stack.map((frame, index) => {
                    const { file, lineNumber } = frame;
                    const isLaunchable = !(0, devServerEndpoints_1.isStackFileAnonymous)(frame) &&
                        symbolicationStatus === 'COMPLETE' &&
                        file != null &&
                        lineNumber != null;
                    return {
                        id: String(index),
                        content: (react_1.default.createElement(StackTraceItem, { key: index, isLaunchable: isLaunchable, frame: frame, onPress: isLaunchable ? () => (0, devServerEndpoints_1.openFileInEditor)(file, lineNumber) : undefined })),
                        isCollapsed: !!frame.collapse,
                    };
                }), showCollapsed: !collapsed, isInitial: isInitial }))));
}
function StackTraceItem({ frame, onPress, isLaunchable, }) {
    const { projectRoot } = (0, ContextDevServer_1.useDevServer)();
    const fileName = (0, devServerEndpoints_1.getStackFormattedLocation)(projectRoot, frame);
    return (react_1.default.createElement("div", { "aria-disabled": !isLaunchable ? true : undefined, onClick: onPress, className: StackTraceList_module_css_1.default.stackFrame, style: {
            opacity: frame.collapse === true ? 0.4 : 1,
        } },
        react_1.default.createElement("code", { className: StackTraceList_module_css_1.default.stackFrameTitle }, frame.methodName),
        react_1.default.createElement("code", { className: StackTraceList_module_css_1.default.stackFrameFile }, fileName)));
}
const ReactIcon = (props) => (react_1.default.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", ...props },
    react_1.default.createElement("path", { d: "M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38a2.167 2.167 0 0 0-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44a23.476 23.476 0 0 0-3.107-.534A23.892 23.892 0 0 0 12.769 4.7c1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442a22.73 22.73 0 0 0-3.113.538 15.02 15.02 0 0 1-.254-1.42c-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87a25.64 25.64 0 0 1-4.412.005 26.64 26.64 0 0 1-1.183-1.86c-.372-.64-.71-1.29-1.018-1.946a25.17 25.17 0 0 1 1.013-1.954c.38-.66.773-1.286 1.18-1.868A25.245 25.245 0 0 1 12 8.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933a25.952 25.952 0 0 0-1.345-2.32zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493a23.966 23.966 0 0 0-1.1-2.98c.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98a23.142 23.142 0 0 0-1.086 2.964c-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39a25.819 25.819 0 0 0 1.341-2.338zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143a22.005 22.005 0 0 1-2.006-.386c.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295a1.185 1.185 0 0 1-.553-.132c-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z" })));
const JavaScriptIcon = (props) => (react_1.default.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", ...props },
    react_1.default.createElement("path", { d: "M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z" })));
function getCollapseMessage(stackFrames, collapsed) {
    if (stackFrames.length === 0) {
        return { full: 'No frames to show', short: 'No frames' };
    }
    const collapsedCount = stackFrames.reduce((count, { collapse }) => {
        if (collapse === true) {
            return count + 1;
        }
        return count;
    }, 0);
    if (collapsedCount === 0) {
        return { full: 'Showing all frames', short: 'Show all' };
    }
    const short = collapsed ? 'Show' : 'Hide';
    const framePlural = `frame${collapsedCount > 1 ? 's' : ''}`;
    if (collapsedCount === stackFrames.length) {
        return {
            full: `${short}${collapsedCount > 1 ? ' all ' : ' '}${collapsedCount} ignore-listed ${framePlural}`,
            short,
        };
    }
    else {
        // Match the chrome inspector wording
        return { full: `${short} ${collapsedCount} ignored-listed ${framePlural}`, short };
    }
}
