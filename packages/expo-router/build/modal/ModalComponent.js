"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalComponent = ModalComponent;
const native_1 = require("@react-navigation/native");
function ModalComponent({ modalConfig }) {
    const component = modalConfig.component;
    const navigationProp = modalConfig.parentNavigationProp;
    return <native_1.NavigationContext value={navigationProp}>{component}</native_1.NavigationContext>;
}
//# sourceMappingURL=ModalComponent.js.map