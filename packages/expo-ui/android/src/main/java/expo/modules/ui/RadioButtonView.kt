package expo.modules.ui

import androidx.compose.material3.RadioButton
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedComposeProps
data class RadioButtonProps(
  val selected: Boolean = false,
  val clickable: Boolean = true,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.RadioButtonContent(
  props: RadioButtonProps,
  onClick: (() -> Unit)?
) {
  RadioButton(
    selected = props.selected,
    onClick = onClick,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  )
}
