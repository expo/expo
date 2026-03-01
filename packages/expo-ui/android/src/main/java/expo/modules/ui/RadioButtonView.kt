package expo.modules.ui

import androidx.compose.material3.RadioButton
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

data class RadioButtonProps(
  val selected: Boolean = false,
  val nativeClickable: Boolean = true,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.RadioButtonContent(
  props: RadioButtonProps,
  onNativeClick: () -> Unit
) {
  RadioButton(
    selected = props.selected,
    onClick = if (props.nativeClickable) {
      { onNativeClick() }
    } else {
      null
    },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  )
}
