import { forFade, forShift } from './SceneStyleInterpolators';
import { FadeSpec, ShiftSpec } from './TransitionSpecs';
export const FadeTransition = {
    transitionSpec: FadeSpec,
    sceneStyleInterpolator: forFade,
};
export const ShiftTransition = {
    transitionSpec: ShiftSpec,
    sceneStyleInterpolator: forShift,
};
//# sourceMappingURL=TransitionPresets.js.map