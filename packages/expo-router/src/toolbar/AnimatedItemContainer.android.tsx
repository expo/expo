import { AnimatedVisibility, EnterTransition, ExitTransition } from '@expo/ui/jetpack-compose';
import type { ReactNode } from 'react';

/**
 * Shared animated container for Android toolbar items.
 */
export function AnimatedItemContainer({
  visible,
  children,
}: {
  visible: boolean;
  children: ReactNode;
}) {
  return (
    <AnimatedVisibility
      // As mentioned in the docs, `scaleIn` does not animate layout, so we need to combine it with `expandIn` to get the layout animation as well. The same applies to `scaleOut` and `shrinkOut`.
      // https://developer.android.com/reference/kotlin/androidx/compose/animation/package-summary#scaleOut(androidx.compose.animation.core.FiniteAnimationSpec,kotlin.Float,androidx.compose.ui.graphics.TransformOrigin)
      enterTransition={EnterTransition.scaleIn().plus(EnterTransition.expandIn())}
      exitTransition={ExitTransition.scaleOut().plus(ExitTransition.shrinkOut())}
      visible={visible}>
      {children}
    </AnimatedVisibility>
  );
}
