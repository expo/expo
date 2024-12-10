"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldHandleMouseEvent = void 0;
const react_native_1 = require("react-native");
const router_store_1 = require("../global-state/router-store");
const matchers_1 = require("../matchers");
const useDomComponentNavigation_1 = require("./useDomComponentNavigation");
const getPathFromState_forks_1 = require("../fork/getPathFromState-forks");
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
    const onPress = (event) => {
        if (shouldHandleMouseEvent(event)) {
            if ((0, useDomComponentNavigation_1.emitDomLinkEvent)(href, options)) {
                return;
            }
            linkTo(href, options);
        }
    };
    let strippedHref = (0, matchers_1.stripGroupSegmentsFromPath)(href) || '/';
    // Append base url only if needed.
    if (!(0, url_1.shouldLinkExternally)(strippedHref)) {
        strippedHref = (0, getPathFromState_forks_1.appendBaseUrl)(strippedHref);
    }
    return {
        href: strippedHref,
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