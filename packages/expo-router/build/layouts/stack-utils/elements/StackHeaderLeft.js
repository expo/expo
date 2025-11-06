"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHeaderLeft = StackHeaderLeft;
exports.appendStackHeaderLeftPropsToOptions = appendStackHeaderLeftPropsToOptions;
function StackHeaderLeft(props) {
    return null;
}
function appendStackHeaderLeftPropsToOptions(options, props) {
    if (!props.asChild) {
        return options;
    }
    return {
        ...options,
        headerLeft: () => props.children,
    };
}
//# sourceMappingURL=StackHeaderLeft.js.map