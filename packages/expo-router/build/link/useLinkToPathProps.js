"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
function useLinkToPathProps(props) {
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
            linkTo(props.href, props.event);
        }
    };
    return {
        // Ensure there's always a value for href. Manually append the baseUrl to the href prop that shows in the static HTML.
        href: (0, getPathFromState_1.appendBaseUrl)((0, matchers_1.stripGroupSegmentsFromPath)(props.href) || '/'),
        role: 'link',
        onPress,
    };
}
exports.default = useLinkToPathProps;
//# sourceMappingURL=useLinkToPathProps.js.map