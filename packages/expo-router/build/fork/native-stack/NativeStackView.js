"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeStackView = void 0;
const native_stack_1 = require("@react-navigation/native-stack");
const react_1 = require("react");
const RootModal_1 = require("../../layouts/RootModal");
function NativeStackView(props) {
    return (<RootModal_1.RootModalProvider>
      <NativeStackViewInner {...props}/>
    </RootModal_1.RootModalProvider>);
}
exports.NativeStackView = NativeStackView;
function NativeStackViewInner(props) {
    const rootModals = (0, react_1.useContext)(RootModal_1.RootModalContext);
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
    return <native_stack_1.NativeStackView {...props} state={state}/>;
}
//# sourceMappingURL=NativeStackView.js.map