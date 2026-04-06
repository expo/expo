"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeToolbarView = void 0;
const jetpack_compose_1 = require("@expo/ui/jetpack-compose");
const modifiers_1 = require("@expo/ui/jetpack-compose/modifiers");
const AnimatedItemContainer_1 = require("../../../../toolbar/AnimatedItemContainer");
const context_1 = require("../context");
const bottomPlacementModifiers = [(0, modifiers_1.fillMaxHeight)()];
const NativeToolbarView = ({ children, hidden }) => {
    const placement = (0, context_1.useToolbarPlacement)();
    const modifiers = placement === 'bottom' ? bottomPlacementModifiers : undefined;
    return (<jetpack_compose_1.Box contentAlignment="center" modifiers={modifiers}>
      <AnimatedItemContainer_1.AnimatedItemContainer visible={!hidden}>
        <jetpack_compose_1.RNHostView matchContents>
          <>{children}</>
        </jetpack_compose_1.RNHostView>
      </AnimatedItemContainer_1.AnimatedItemContainer>
    </jetpack_compose_1.Box>);
};
exports.NativeToolbarView = NativeToolbarView;
//# sourceMappingURL=native.android.js.map