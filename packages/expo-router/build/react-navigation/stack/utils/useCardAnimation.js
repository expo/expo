"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCardAnimation = useCardAnimation;
const react_1 = require("react");
const CardAnimationContext_1 = require("./CardAnimationContext");
function useCardAnimation() {
    const animation = (0, react_1.use)(CardAnimationContext_1.CardAnimationContext);
    if (animation === undefined) {
        throw new Error("Couldn't find values for card animation. Are you inside a screen in Stack?");
    }
    return animation;
}
//# sourceMappingURL=useCardAnimation.js.map