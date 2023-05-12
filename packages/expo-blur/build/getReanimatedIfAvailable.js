export default function getReanimatedIfAvailable() {
    let Reanimated;
    // If available import react-native-reanimated
    try {
        Reanimated = require('react-native-reanimated');
        // Make sure that imported reanimated has the required functions
        if (!Reanimated?.default.createAnimatedComponent ||
            !Reanimated.useAnimatedProps ||
            !Reanimated.useAnimatedStyle ||
            !Reanimated.default.View) {
            Reanimated = undefined;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    }
    catch (e) {
        // Quietly continue when 'react-native-reanimated' is not available
        Reanimated = undefined;
    }
    return Reanimated;
}
//# sourceMappingURL=getReanimatedIfAvailable.js.map