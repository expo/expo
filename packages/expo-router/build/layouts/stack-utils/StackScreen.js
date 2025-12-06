"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackScreen = StackScreen;
exports.appendScreenStackPropsToOptions = appendScreenStackPropsToOptions;
const react_1 = require("react");
const StackHeaderComponent_1 = require("./StackHeaderComponent");
const Screen_1 = require("../../views/Screen");
function StackScreen({ children, options, ...rest }) {
    // This component will only render when used inside a page.
    const updatedOptions = (0, react_1.useMemo)(() => appendScreenStackPropsToOptions(options ?? {}, {
        children,
    }), [options, children]);
    return <Screen_1.Screen {...rest} options={updatedOptions}/>;
}
function appendScreenStackPropsToOptions(options, props) {
    let updatedOptions = { ...options, ...props.options };
    function appendChildOptions(child, options) {
        if (child.type === StackHeaderComponent_1.StackHeaderComponent) {
            updatedOptions = (0, StackHeaderComponent_1.appendStackHeaderPropsToOptions)(options, child.props);
        }
        else {
            console.warn(`Warning: Unknown child element passed to Stack.Screen: ${child.type.name ?? child.type}`);
        }
        return updatedOptions;
    }
    react_1.Children.forEach(props.children, (child) => {
        if ((0, react_1.isValidElement)(child)) {
            updatedOptions = appendChildOptions(child, updatedOptions);
        }
    });
    return updatedOptions;
}
//# sourceMappingURL=StackScreen.js.map