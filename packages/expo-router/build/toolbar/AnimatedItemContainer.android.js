"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimatedItemContainer = AnimatedItemContainer;
const jsx_runtime_1 = require("react/jsx-runtime");
const jetpack_compose_1 = require("@expo/ui/jetpack-compose");
/**
 * Shared animated container for Android toolbar items.
 */
function AnimatedItemContainer({ visible, children, }) {
    return ((0, jsx_runtime_1.jsx)(jetpack_compose_1.AnimatedVisibility
    // As mentioned in the docs, `scaleIn` does not animate layout, so we need to combine it with `expandIn` to get the layout animation as well. The same applies to `scaleOut` and `shrinkOut`.
    // https://developer.android.com/reference/kotlin/androidx/compose/animation/package-summary#scaleOut(androidx.compose.animation.core.FiniteAnimationSpec,kotlin.Float,androidx.compose.ui.graphics.TransformOrigin)
    , { 
        // As mentioned in the docs, `scaleIn` does not animate layout, so we need to combine it with `expandIn` to get the layout animation as well. The same applies to `scaleOut` and `shrinkOut`.
        // https://developer.android.com/reference/kotlin/androidx/compose/animation/package-summary#scaleOut(androidx.compose.animation.core.FiniteAnimationSpec,kotlin.Float,androidx.compose.ui.graphics.TransformOrigin)
        enterTransition: jetpack_compose_1.EnterTransition.scaleIn().plus(jetpack_compose_1.EnterTransition.expandIn()), exitTransition: jetpack_compose_1.ExitTransition.scaleOut().plus(jetpack_compose_1.ExitTransition.shrinkOut()), visible: visible, children: children }));
}
//# sourceMappingURL=AnimatedItemContainer.android.js.map