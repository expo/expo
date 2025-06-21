"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalComponent = ModalComponent;
const native_1 = require("@react-navigation/native");
const react_native_1 = require("react-native");
function ModalComponent({ modalConfig }) {
    const component = modalConfig.component;
    const navigationProp = modalConfig.parentNavigationProp;
    if (navigationProp) {
        return (<native_1.NavigationContext value={navigationProp}>
        <react_native_1.View style={{ flex: 1 }}>{component}</react_native_1.View>
      </native_1.NavigationContext>);
    }
    return <react_native_1.View style={{ flex: 1 }}>{component}</react_native_1.View>;
}
//# sourceMappingURL=ModalComponent.js.map