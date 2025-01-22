package expo.modules.ui

import android.content.Context
import androidx.compose.material3.Checkbox
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.material3.Switch
import androidx.compose.material3.Button
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposeProps

data class SwitchProps(
  val checked: MutableState<Boolean> = mutableStateOf(false),
  val type: MutableState<String> = mutableStateOf("switch")
): ComposeProps

class SwitchView(context: Context, appContext: AppContext) : ExpoComposeView<SwitchProps>(context, appContext) {
  override val props = SwitchProps()
  private val onCheckedChanged by EventDispatcher()

  init {
    setContent {
      val (checked) = props.checked
      val (type) = props.type
      val onCheckedChange = { checked: Boolean ->
        onCheckedChanged(mapOf("checked" to checked))
      }

      @Composable
      fun SwitchComposable() {
        Switch(
          checked = checked,
          onCheckedChange = onCheckedChange
        )
      }

      @Composable
      fun CheckboxComposable() {
        Checkbox(
          checked = checked,
          onCheckedChange = onCheckedChange
        )
      }

      if(type == "switch") {
        SwitchComposable()
      } else {
        CheckboxComposable()
      }
    }
  }
}
