"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeToolbarSpacer = void 0;
const jetpack_compose_1 = require("@expo/ui/jetpack-compose");
const modifiers_1 = require("@expo/ui/jetpack-compose/modifiers");
const AnimatedItemContainer_1 = require("../../../../toolbar/AnimatedItemContainer");
/**
 * Native toolbar spacer component for Android bottom toolbar.
 * Only supports fixed-width spacers
 */
const NativeToolbarSpacer = (props) => {
    if (!props.width) {
        return null;
    }
    return (<AnimatedItemContainer_1.AnimatedItemContainer visible={!props.hidden}>
      <jetpack_compose_1.Box modifiers={[(0, modifiers_1.width)(props.width)]}/>
    </AnimatedItemContainer_1.AnimatedItemContainer>);
};
exports.NativeToolbarSpacer = NativeToolbarSpacer;
//# sourceMappingURL=native.android.js.map