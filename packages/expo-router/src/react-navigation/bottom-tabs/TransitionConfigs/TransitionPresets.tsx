import type { BottomTabTransitionPreset } from '../types';
import { forFade, forShift } from './SceneStyleInterpolators';
import { FadeSpec, ShiftSpec } from './TransitionSpecs';

export const FadeTransition: BottomTabTransitionPreset = {
  transitionSpec: FadeSpec,
  sceneStyleInterpolator: forFade,
};

export const ShiftTransition: BottomTabTransitionPreset = {
  transitionSpec: ShiftSpec,
  sceneStyleInterpolator: forShift,
};
