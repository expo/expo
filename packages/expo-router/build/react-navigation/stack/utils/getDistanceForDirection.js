import { getInvertedMultiplier } from './getInvertedMultiplier';
export function getDistanceForDirection(layout, gestureDirection, isRTL) {
    const multiplier = getInvertedMultiplier(gestureDirection, isRTL);
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