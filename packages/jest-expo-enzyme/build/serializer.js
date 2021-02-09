"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_native_1 = require("react-native");
function create(StyleSheet) {
    function flattenNodeStyles(node) {
        if (node && node.props) {
            // check for React elements in any props
            const nextProps = Object.keys(node.props).reduce((acc, curr) => {
                const value = node.props[curr];
                if (react_1.isValidElement(value)) {
                    acc[curr] = flattenNodeStyles(value);
                }
                return acc;
            }, {});
            // flatten styles and avoid empty objects in snapshots
            if (node.props.style) {
                const style = StyleSheet.flatten(node.props.style);
                if (Object.keys(style).length > 0) {
                    nextProps.style = style;
                }
                else {
                    delete nextProps.style;
                }
            }
            const args = [node, nextProps];
            // recurse over children too
            const children = node.children || node.props.children;
            if (children) {
                if (Array.isArray(children)) {
                    children.forEach(child => {
                        args.push(flattenNodeStyles(child));
                    });
                }
                else {
                    args.push(flattenNodeStyles(children));
                }
            }
            return react_1.cloneElement.apply(react_1.cloneElement, args);
        }
        return node;
    }
    return {
        test(value) {
            return !!value && value.$$typeof === Symbol.for('react.test.json');
        },
        print(value, serialize) {
            return serialize(flattenNodeStyles(value));
        },
    };
}
exports.default = create(react_native_1.StyleSheet);
//# sourceMappingURL=serializer.js.map