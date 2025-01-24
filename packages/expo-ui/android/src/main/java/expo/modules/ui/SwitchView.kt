package expo.modules.ui

import android.content.Context
import android.content.res.Resources
import android.util.Log
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.material3.Checkbox
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.material3.Switch
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.unit.Constraints
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.AutoSizingComposable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ShadowNodeProxy

data class SwitchProps(
  val checked: MutableState<Boolean> = mutableStateOf(false),
  val variant: MutableState<String> = mutableStateOf("switch")
): ComposeProps

class SwitchView(context: Context, appContext: AppContext) : ExpoComposeView<SwitchProps>(context, appContext) {
  override val props = SwitchProps()
  private val onCheckedChanged by EventDispatcher()

  init {
    setContent {
      val (checked) = props.checked
      val (variant) = props.variant
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
      AutoSizingComposable(utils){
        if (variant == "switch") {
          SwitchComposable()
        } else {
          CheckboxComposable()
        }
      }
    }
  }
}
