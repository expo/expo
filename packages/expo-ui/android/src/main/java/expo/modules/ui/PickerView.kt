package expo.modules.ui

import android.content.Context
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.AutoSizingComposable
import expo.modules.kotlin.views.ComposeProps

data class PickerProps(
  val options: MutableState<Array<String>> = mutableStateOf(emptyArray()),
  val selectedIndex: MutableState<Int?> = mutableStateOf(null)
) : ComposeProps

class PickerView(context: Context, appContext: AppContext) : ExpoComposeView<PickerProps>(context, appContext) {
  override val props = PickerProps()
  private val onOptionSelected by EventDispatcher()

  init {
    setContent {
      val selectedIndex by remember { props.selectedIndex }
      val options by remember { props.options }
      AutoSizingComposable(shadowNodeProxy) {
        SingleChoiceSegmentedButtonRow {
          options.forEachIndexed { index, label ->
            SegmentedButton(
              shape = SegmentedButtonDefaults.itemShape(
                index = index,
                count = options.size
              ),
              onClick = {
                onOptionSelected(mapOf("index" to index, "label" to label))
              },
              selected = index == selectedIndex,
              label = { Text(label) }
            )
          }
        }
      }
    }
  }
}
