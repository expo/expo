package expo.modules.ui

import android.content.Context
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.material3.RadioButton
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposeProps

data class PickerProps(
  val options: MutableState<Array<String>> = mutableStateOf(emptyArray()),
  val selectedIndex: MutableState<Int?> = mutableStateOf(null),
  val variant: MutableState<String> = mutableStateOf("segmented")
) : ComposeProps

class PickerView(context: Context, appContext: AppContext) : ExpoComposeView<PickerProps>(context, appContext) {
  override val props = PickerProps()
  private val onOptionSelected by EventDispatcher()

  init {
    setContent {
      val selectedIndex by remember { props.selectedIndex }
      val options by remember { props.options }
      val (variant) = props.variant

      @Composable
      fun SegmentedComposable() {
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

      @Composable
      fun RadioComposable() {
        Column(Modifier.selectableGroup()) {
          options.forEachIndexed { index, label ->
            Row(
              Modifier.fillMaxWidth()
                .height(28.dp)
                .selectable(
                  selected = index == selectedIndex,
                  onClick = {
                    onOptionSelected(mapOf("index" to index, "label" to label))
                  },
                  role = Role.RadioButton
                ),
              verticalAlignment = Alignment.CenterVertically
            ) {
              RadioButton(
                selected = index == selectedIndex,
                onClick = null
              )
              Text(
                text = label,
                modifier = Modifier.padding(start = 12.dp)
              )
            }
          }
        }
      }

      if (variant == "segmented") {
        SegmentedComposable()
      } else if (variant == "radio") {
        RadioComposable()
      }
    }
  }
}
