package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.button.ButtonPressedEvent

data class TextButtonProps(
  val text: String = "",
  val color: Color? = null,
  val disabled: Boolean = false,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.TextButtonContent(
  props: TextButtonProps,
  onButtonPressed: (ButtonPressedEvent) -> Unit
) {
  TextButton(
    onClick = { onButtonPressed(ButtonPressedEvent()) },
    enabled = !props.disabled,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Text(
      text = props.text,
      color = props.color.composeOrNull ?: androidx.compose.ui.graphics.Color.Unspecified
    )
  }
}
