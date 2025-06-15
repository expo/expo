"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalComponent = ModalComponent;
const native_1 = require("@react-navigation/native");
const react_1 = require("react");
const react_native_1 = require("react-native");
const ModalContext_1 = require("./ModalContext");
const useFocusEffect_1 = require("../useFocusEffect");
function ModalComponent() {
    const { modalConfig, closeModal } = (0, ModalContext_1.useModalContext)();
    const component = modalConfig?.component;
    const navigationProp = modalConfig?.navigationProp;
    (0, useFocusEffect_1.useFocusEffect)((0, react_1.useCallback)(() => {
        return () => closeModal(true);
    }, [closeModal]));
    if (navigationProp) {
        return (<native_1.NavigationContext value={navigationProp}>
        <react_native_1.View style={{ flex: 1 }}>{component}</react_native_1.View>
      </native_1.NavigationContext>);
    }
    return <react_native_1.View style={{ flex: 1 }}>{component}</react_native_1.View>;
}
//# sourceMappingURL=ModalComponent.js.map