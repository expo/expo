"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHeaderButton = StackHeaderButton;
exports.convertStackHeaderButtonPropsToRNHeaderItem = convertStackHeaderButtonPropsToRNHeaderItem;
const shared_1 = require("./shared");
function StackHeaderButton(props) {
    return null;
}
function convertStackHeaderButtonPropsToRNHeaderItem(props) {
    return {
        ...(0, shared_1.convertStackHeaderSharedPropsToRNSharedHeaderItem)(props),
        type: 'button',
        onPress: props.onPress ?? (() => { }),
        selected: !!props.selected,
    };
}
//# sourceMappingURL=StackHeaderButton.js.map