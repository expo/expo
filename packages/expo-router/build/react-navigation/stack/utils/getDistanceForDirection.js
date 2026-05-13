"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDistanceForDirection = getDistanceForDirection;
const getInvertedMultiplier_1 = require("./getInvertedMultiplier");
function getDistanceForDirection(layout, gestureDirection, isRTL) {
    const multiplier = (0, getInvertedMultiplier_1.getInvertedMultiplier)(gestureDirection, isRTL);
    switch (gestureDirection) {
        case 'vertical':
        case 'vertical-inverted':
            return layout.height * multiplier;
        case 'horizontal':
        case 'horizontal-inverted':
            return layout.width * multiplier;
    }
}
//# sourceMappingURL=getDistanceForDirection.js.map