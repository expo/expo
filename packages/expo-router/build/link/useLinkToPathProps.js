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
exports.shouldHandleMouseEvent = void 0;
const react_native_1 = require("react-native");
const expo = __importStar(require("../fork/getPathFromState-forks"));
const router_store_1 = require("../global-state/router-store");
const matchers_1 = require("../matchers");
const useDomComponentNavigation_1 = require("./useDomComponentNavigation");
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
    const onPress = (event) => {
        if (shouldHandleMouseEvent(event)) {
            if ((0, useDomComponentNavigation_1.emitDomLinkEvent)(href, options)) {
                return;
            }
            linkTo(href, options);
        }
    };
    return {
        // Ensure there's always a value for href. Manually append the baseUrl to the href prop that shows in the static HTML.
        href: expo.appendBaseUrl((0, matchers_1.stripGroupSegmentsFromPath)(href) || '/'),
        role: 'link',
        onPress,
    };
}
exports.default = useLinkToPathProps;
function shouldHandleMouseEvent(event) {
    if (react_native_1.Platform.OS !== 'web') {
        return !event?.defaultPrevented;
    }
    if (event && eventShouldPreventDefault(event)) {
        event.preventDefault();
        return true;
    }
    return false;
}
exports.shouldHandleMouseEvent = shouldHandleMouseEvent;
//# sourceMappingURL=useLinkToPathProps.js.map