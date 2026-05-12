"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftTransition = exports.FadeTransition = void 0;
const SceneStyleInterpolators_1 = require("./SceneStyleInterpolators");
const TransitionSpecs_1 = require("./TransitionSpecs");
exports.FadeTransition = {
    transitionSpec: TransitionSpecs_1.FadeSpec,
    sceneStyleInterpolator: SceneStyleInterpolators_1.forFade,
};
exports.ShiftTransition = {
    transitionSpec: TransitionSpecs_1.ShiftSpec,
    sceneStyleInterpolator: SceneStyleInterpolators_1.forShift,
};
//# sourceMappingURL=TransitionPresets.js.map