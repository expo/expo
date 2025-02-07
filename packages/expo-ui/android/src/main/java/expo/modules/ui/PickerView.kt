package expo.modules.ui

import android.content.Context
import android.graphics.Color
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoComposeView
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposeProps

class PickerColors : Record {
  @Field
  val activeBorderColor: Color? = null

  @Field
  val activeContentColor: Color? = null

  @Field
  val inactiveBorderColor: Color? = null

  @Field
  val inactiveContentColor: Color? = null

  @Field
  val disabledActiveBorderColor: Color? = null

  @Field
  val disabledActiveContentColor: Color? = null

  @Field
  val disabledInactiveBorderColor: Color? = null

  @Field
  val disabledInactiveContentColor: Color? = null

  @Field
  val activeContainerColor: Color? = null

  @Field
  val inactiveContainerColor: Color? = null

  @Field
  val disabledActiveContainerColor: Color? = null

  @Field
  val disabledInactiveContainerColor: Color? = null
}

data class PickerProps(
  val options: MutableState<Array<String>> = mutableStateOf(emptyArray()),
  val selectedIndex: MutableState<Int?> = mutableStateOf(null),
  val elementColors: MutableState<PickerColors> = mutableStateOf(PickerColors())
) : ComposeProps

class PickerView(context: Context, appContext: AppContext) : ExpoComposeView<PickerProps>(context, appContext) {
  override val props = PickerProps()
  private val onOptionSelected by EventDispatcher()

  init {
    setContent {
      val (selectedIndex) = props.selectedIndex
      val (options) = props.options
      val (colors) = props.elementColors
      DynamicTheme {
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
              label = { Text(label) },
              colors = SegmentedButtonDefaults.colors(
                activeBorderColor = colors.activeBorderColor.compose,
                activeContentColor = colors.activeContentColor.compose,
                inactiveBorderColor = colors.inactiveBorderColor.compose,
                inactiveContentColor = colors.inactiveContentColor.compose,
                disabledActiveBorderColor = colors.disabledActiveBorderColor.compose,
                disabledActiveContentColor = colors.disabledActiveContentColor.compose,
                disabledInactiveBorderColor = colors.disabledInactiveBorderColor.compose,
                disabledInactiveContentColor = colors.disabledInactiveContentColor.compose,
                activeContainerColor = colors.activeContainerColor.compose,
                inactiveContainerColor = colors.inactiveContainerColor.compose,
                disabledActiveContainerColor = colors.disabledActiveContainerColor.compose,
                disabledInactiveContainerColor = colors.disabledInactiveContainerColor.compose
              )
            )
          }
        }
      }
    }
  }
}
