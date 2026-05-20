"use strict";
'use client';
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardContent = CardContent;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
// This component will render a page which overflows the screen
// if the container fills the body by comparing the size
// This lets the document.body handle scrolling of the content
// It's necessary for mobile browsers to be able to hide address bar on scroll
function CardContent({ enabled, layout, style, ...rest }) {
    const [fill, setFill] = React.useState(false);
    React.useEffect(() => {
        if (typeof document === 'undefined' || !document.body) {
            // Only run when DOM is available
            return;
        }
        const width = document.body.clientWidth;
        const height = document.body.clientHeight;
        // Workaround for mobile Chrome, necessary when a navigation happens
        // when the address bar has already collapsed, which resulted in an
        // empty space at the bottom of the page (matching the height of the
        // address bar). To fix this, it's necessary to update the height of
        // the DOM with the current height of the window.
        // See https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
        const isFullHeight = height === layout.height;
        const id = '__react-navigation-stack-mobile-chrome-viewport-fix';
        let unsubscribe;
        if (isFullHeight && navigator.maxTouchPoints > 0) {
            const style = document.getElementById(id) ?? document.createElement('style');
            style.id = id;
            const updateStyle = () => {
                const vh = window.innerHeight * 0.01;
                style.textContent = [
                    `:root { --vh: ${vh}px; }`,
                    `body { height: calc(var(--vh, 1vh) * 100); }`,
                ].join('\n');
            };
            updateStyle();
            if (!document.head.contains(style)) {
                document.head.appendChild(style);
            }
            window.addEventListener('resize', updateStyle);
            unsubscribe = () => {
                window.removeEventListener('resize', updateStyle);
            };
        }
        else {
            // Remove the workaround if the stack does not occupy the whole
            // height of the page
            document.getElementById(id)?.remove();
        }
        setFill(width === layout.width && height === layout.height);
        return unsubscribe;
    }, [layout.height, layout.width]);
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { ...rest, style: [styles.boxNone, enabled && fill ? styles.page : styles.card, style] }));
}
const styles = react_native_1.StyleSheet.create({
    page: {
        minHeight: '100%',
    },
    card: {
        flex: 1,
        overflow: 'hidden',
    },
    boxNone: {
        pointerEvents: 'box-none',
    },
});
//# sourceMappingURL=CardContent.js.map