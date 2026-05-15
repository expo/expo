"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimatedItemContainer = AnimatedItemContainer;
const jsx_runtime_1 = require("react/jsx-runtime");
const expo_ui_1 = require("../optional-dependencies/expo-ui");
/**
 * Shared animated container for Android toolbar items.
 */
function AnimatedItemContainer({ visible, children, }) {
    const { AnimatedVisibility, EnterTransition, ExitTransition } = (0, expo_ui_1.getExpoUiJetpackCompose)('Animated Android toolbar items');
    return ((0, jsx_runtime_1.jsx)(AnimatedVisibility
    // As mentioned in the docs, `scaleIn` does not animate layout, so we need to combine it with `expandIn` to get the layout animation as well. The same applies to `scaleOut` and `shrinkOut`.
    // https://developer.android.com/reference/kotlin/androidx/compose/animation/package-summary#scaleOut(androidx.compose.animation.core.FiniteAnimationSpec,kotlin.Float,androidx.compose.ui.graphics.TransformOrigin)
    , { 
        // As mentioned in the docs, `scaleIn` does not animate layout, so we need to combine it with `expandIn` to get the layout animation as well. The same applies to `scaleOut` and `shrinkOut`.
        // https://developer.android.com/reference/kotlin/androidx/compose/animation/package-summary#scaleOut(androidx.compose.animation.core.FiniteAnimationSpec,kotlin.Float,androidx.compose.ui.graphics.TransformOrigin)
        enterTransition: EnterTransition.scaleIn().plus(EnterTransition.expandIn()), exitTransition: ExitTransition.scaleOut().plus(ExitTransition.shrinkOut()), visible: visible, children: children }));
}
//# sourceMappingURL=AnimatedItemContainer.android.js.map