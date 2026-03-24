"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeToolbarView = void 0;
const jetpack_compose_1 = require("@expo/ui/jetpack-compose");
const modifiers_1 = require("@expo/ui/jetpack-compose/modifiers");
const AnimatedItemContainer_1 = require("../../../../toolbar/AnimatedItemContainer");
const NativeToolbarView = ({ children, hidden }) => {
    return (<jetpack_compose_1.Box modifiers={[(0, modifiers_1.fillMaxHeight)()]} contentAlignment="center">
      <AnimatedItemContainer_1.AnimatedItemContainer visible={!hidden}>
        <jetpack_compose_1.RNHostView matchContents>
          <>{children}</>
        </jetpack_compose_1.RNHostView>
      </AnimatedItemContainer_1.AnimatedItemContainer>
    </jetpack_compose_1.Box>);
};
exports.NativeToolbarView = NativeToolbarView;
//# sourceMappingURL=native.android.js.map