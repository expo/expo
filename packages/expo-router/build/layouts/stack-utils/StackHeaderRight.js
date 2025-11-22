"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHeaderRight = StackHeaderRight;
exports.appendStackHeaderRightPropsToOptions = appendStackHeaderRightPropsToOptions;
function StackHeaderRight(props) {
    return null;
}
function appendStackHeaderRightPropsToOptions(options, props) {
    if (!props.asChild) {
        return options;
    }
    return {
        ...options,
        headerRight: () => props.children,
    };
}
//# sourceMappingURL=StackHeaderRight.js.map