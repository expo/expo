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
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const getPathFromState_1 = require("../fork/getPathFromState");
const router_store_1 = require("../global-state/router-store");
const matchers_1 = require("../matchers");
const url_1 = require("../utils/url");
function eventShouldPreventDefault(e) {
    if (e?.defaultPrevented) {
        return false;
    }
    if (
    // Only check MouseEvents
    'button' in e &&
        // ignore clicks with modifier keys
        !e.metaKey &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        (e.button == null || e.button === 0) && // Only accept left clicks
        [undefined, null, '', 'self'].includes(e.currentTarget.target) // let browser handle "target=_blank" etc.
    ) {
        return true;
    }
    return false;
}
function useLinkToPathProps({ href, ...options }) {
    const { linkTo } = (0, router_store_1.useExpoRouter)();
    const onPress = (e) => {
        let shouldHandle = false;
        if (react_native_1.Platform.OS !== 'web' || !e) {
            shouldHandle = e ? !e.defaultPrevented : true;
        }
        else if (eventShouldPreventDefault(e)) {
            e.preventDefault();
            shouldHandle = true;
        }
        if (shouldHandle) {
            linkTo(href, options);
        }
    };
    const baseAppendedStrippedHref = React.useMemo(() => {
        const strippedHref = (0, matchers_1.stripGroupSegmentsFromPath)(href);
        // Ensure there's always a value for href.
        if (!strippedHref) {
            return (0, getPathFromState_1.appendBaseUrl)('/');
        }
        // Append base url only if needed (for non-external URLs)
        if ((0, url_1.shouldLinkExternally)(strippedHref)) {
            return strippedHref;
        }
        else {
            return (0, getPathFromState_1.appendBaseUrl)(strippedHref);
        }
    }, [href]);
    return {
        href: baseAppendedStrippedHref,
        role: 'link',
        onPress,
    };
}
exports.default = useLinkToPathProps;
//# sourceMappingURL=useLinkToPathProps.js.map