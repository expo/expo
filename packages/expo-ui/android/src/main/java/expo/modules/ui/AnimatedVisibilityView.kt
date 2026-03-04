package expo.modules.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

// TODO(@ubax): Add configurable enter/exit transition support

data class AnimatedVisibilityProps(
  val visible: Boolean = true,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.AnimatedVisibilityContent(props: AnimatedVisibilityProps) {
  AnimatedVisibility(
    visible = props.visible,
    modifier = ModifierRegistry
      .applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(ComposableScope())
  }
}
