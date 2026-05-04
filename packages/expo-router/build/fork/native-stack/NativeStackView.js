"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeStackView = NativeStackView;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const RootModal_1 = require("../../layouts/RootModal");
const native_stack_1 = require("../../react-navigation/native-stack");
function NativeStackView(props) {
    return ((0, jsx_runtime_1.jsx)(RootModal_1.RootModalProvider, { children: (0, jsx_runtime_1.jsx)(NativeStackViewInner, { ...props }) }));
}
function NativeStackViewInner(props) {
    const rootModals = (0, react_1.use)(RootModal_1.RootModalContext);
    // Append the root modals to the state
    const state = (0, react_1.useMemo)(() => {
        if (rootModals.routes.length === 0) {
            return props.state;
        }
        return {
            ...props.state,
            routes: props.state.routes.concat(rootModals.routes),
        };
    }, [props.state, rootModals.routes]);
    return (0, jsx_runtime_1.jsx)(native_stack_1.NativeStackView, { ...props, state: state });
}
//# sourceMappingURL=NativeStackView.js.map