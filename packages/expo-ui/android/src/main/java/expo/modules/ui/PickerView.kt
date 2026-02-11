package expo.modules.ui

import android.graphics.Color
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.material3.RadioButton
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

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
  val options: Array<String> = emptyArray(),
  val selectedIndex: Int? = null,
  val elementColors: PickerColors = PickerColors(),
  val variant: String = "segmented",
  val buttonModifiers: List<ModifierType> = emptyList(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

data class PickerOptionSelectedEvent(
  @Field val index: Int,
  @Field val label: String
) : Record

@Composable
fun FunctionalComposableScope.PickerContent(
  props: PickerProps,
  onOptionSelected: (PickerOptionSelectedEvent) -> Unit
) {
  val selectedIndex = props.selectedIndex
  val options = props.options
  val colors = props.elementColors
  val variant = props.variant

  @Composable
  fun SegmentedComposable() {
    SingleChoiceSegmentedButtonRow(
      modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope)
    ) {
      options.forEachIndexed { index, label ->
        SegmentedButton(
          shape = SegmentedButtonDefaults.itemShape(
            index = index,
            count = options.size
          ),
          onClick = {
            onOptionSelected(PickerOptionSelectedEvent(index, label))
          },
          modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope),
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
                onOptionSelected(PickerOptionSelectedEvent(index, label))
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
  } else {
    // Default to segmented picker
    SegmentedComposable()
  }
}
