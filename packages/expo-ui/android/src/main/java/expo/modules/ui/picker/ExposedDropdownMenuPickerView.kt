package expo.modules.ui.picker

import android.graphics.Color
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuAnchorType
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MenuDefaults
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.composeOrNull
import expo.modules.ui.findChildSlotView

data class ExposedDropdownMenuPickerColors(
  // TextField text colors
  @Field val focusedTextColor: Color? = null,
  @Field val unfocusedTextColor: Color? = null,
  @Field val disabledTextColor: Color? = null,
  // TextField container (background) colors
  @Field val focusedContainerColor: Color? = null,
  @Field val unfocusedContainerColor: Color? = null,
  @Field val disabledContainerColor: Color? = null,
  // TextField indicator (underline) colors
  @Field val focusedIndicatorColor: Color? = null,
  @Field val unfocusedIndicatorColor: Color? = null,
  @Field val disabledIndicatorColor: Color? = null,
  // TextField trailing icon (dropdown arrow) colors
  @Field val focusedTrailingIconColor: Color? = null,
  @Field val unfocusedTrailingIconColor: Color? = null,
  @Field val disabledTrailingIconColor: Color? = null,
  // Dropdown menu container color
  @Field val menuContainerColor: Color? = null
) : Record

data class ExposedDropdownMenuPickerProps(
  val value: String = "",
  val expanded: Boolean = false,
  val enabled: Boolean = true,
  val colors: ExposedDropdownMenuPickerColors = ExposedDropdownMenuPickerColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunctionalComposableScope.ExposedDropdownMenuPickerContent(
  props: ExposedDropdownMenuPickerProps,
  onExpandedChange: (Boolean) -> Unit
) {
  val itemsSlotView = findChildSlotView(view, "items")
  val colors = props.colors
  val defaultTextFieldColors = ExposedDropdownMenuDefaults.textFieldColors()

  ExposedDropdownMenuBox(
    expanded = props.expanded,
    onExpandedChange = { if (props.enabled) onExpandedChange(it) },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    TextField(
      value = props.value,
      onValueChange = {},
      readOnly = true,
      enabled = props.enabled,
      trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = props.expanded) },
      colors = ExposedDropdownMenuDefaults.textFieldColors(
        focusedTextColor = colors.focusedTextColor.composeOrNull
          ?: defaultTextFieldColors.focusedTextColor,
        unfocusedTextColor = colors.unfocusedTextColor.composeOrNull
          ?: defaultTextFieldColors.unfocusedTextColor,
        disabledTextColor = colors.disabledTextColor.composeOrNull
          ?: defaultTextFieldColors.disabledTextColor,
        focusedContainerColor = colors.focusedContainerColor.composeOrNull
          ?: defaultTextFieldColors.focusedContainerColor,
        unfocusedContainerColor = colors.unfocusedContainerColor.composeOrNull
          ?: defaultTextFieldColors.unfocusedContainerColor,
        disabledContainerColor = colors.disabledContainerColor.composeOrNull
          ?: defaultTextFieldColors.disabledContainerColor,
        focusedIndicatorColor = colors.focusedIndicatorColor.composeOrNull
          ?: defaultTextFieldColors.focusedIndicatorColor,
        unfocusedIndicatorColor = colors.unfocusedIndicatorColor.composeOrNull
          ?: defaultTextFieldColors.unfocusedIndicatorColor,
        disabledIndicatorColor = colors.disabledIndicatorColor.composeOrNull
          ?: defaultTextFieldColors.disabledIndicatorColor,
        focusedTrailingIconColor = colors.focusedTrailingIconColor.composeOrNull
          ?: defaultTextFieldColors.focusedTrailingIconColor,
        unfocusedTrailingIconColor = colors.unfocusedTrailingIconColor.composeOrNull
          ?: defaultTextFieldColors.unfocusedTrailingIconColor,
        disabledTrailingIconColor = colors.disabledTrailingIconColor.composeOrNull
          ?: defaultTextFieldColors.disabledTrailingIconColor
      ),
      modifier = androidx.compose.ui.Modifier.menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable)
    )

    ExposedDropdownMenu(
      expanded = props.expanded,
      onDismissRequest = { onExpandedChange(false) },
      containerColor = colors.menuContainerColor.composeOrNull ?: MenuDefaults.containerColor
    ) {
      itemsSlotView?.let {
        with(ComposableScope()) {
          with(it) {
            Content()
          }
        }
      }
    }
  }
}
