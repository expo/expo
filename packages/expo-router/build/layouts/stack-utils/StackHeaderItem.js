"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHeaderItem = StackHeaderItem;
exports.convertStackHeaderItemPropsToRNHeaderItem = convertStackHeaderItemPropsToRNHeaderItem;
function StackHeaderItem(props) {
    return null;
}
function convertStackHeaderItemPropsToRNHeaderItem(props) {
    const { children, ...rest } = props;
    if (!children) {
        console.warn('Stack.Header.Item requires a child element to render custom content in the header.');
    }
    return {
        ...rest,
        type: 'custom',
        element: children ?? <></>,
    };
}
//# sourceMappingURL=StackHeaderItem.js.map