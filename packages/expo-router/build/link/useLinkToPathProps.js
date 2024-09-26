"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldHandleMouseEvent = void 0;
const react_native_1 = require("react-native");
const getPathFromState_1 = require("../fork/getPathFromState");
const router_store_1 = require("../global-state/router-store");
const matchers_1 = require("../matchers");
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
            linkTo(href, options);
        }
    };
    return {
        // Ensure there's always a value for href. Manually append the baseUrl to the href prop that shows in the static HTML.
        href: (0, getPathFromState_1.appendBaseUrl)((0, matchers_1.stripGroupSegmentsFromPath)(href) || '/'),
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