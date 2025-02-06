package expo.modules.ui

import android.content.Context
import androidx.compose.material3.Checkbox
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.material3.Switch
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

open class CheckedChangedEvent(
  @Field open val checked: Boolean = false
) : Record, Serializable

data class SwitchProps(
  val checked: MutableState<Boolean> = mutableStateOf(false),
  val variant: MutableState<String> = mutableStateOf("switch")
) : ComposeProps

class SwitchView(context: Context, appContext: AppContext) : ExpoComposeView<SwitchProps>(context, appContext) {
  override val props = SwitchProps()
  private val onCheckedChanged by EventDispatcher<CheckedChangedEvent>()

  init {
    setContent {
      val (checked) = props.checked
      val (variant) = props.variant
      val onCheckedChange = { checked: Boolean ->
        onCheckedChanged(CheckedChangedEvent(checked))
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

      DynamicTheme {
        if (variant == "switch") {
          SwitchComposable()
        } else {
          CheckboxComposable()
        }
      }
    }
  }
}
