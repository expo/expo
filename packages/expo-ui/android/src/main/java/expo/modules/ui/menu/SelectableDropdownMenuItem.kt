package expo.modules.ui.menu

import android.graphics.Color
import androidx.compose.material3.MenuDefaults
import androidx.compose.material3.SelectableDropdownMenuItem
import androidx.compose.runtime.Composable
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.compose
import expo.modules.ui.findChildSlotView
import expo.modules.ui.renderSlot

@OptimizedRecord
class SelectableDropdownMenuItemColors : Record {
  @Field val textColor: Color? = null

  @Field val containerColor: Color? = null

  @Field val leadingIconColor: Color? = null

  @Field val trailingContentColor: Color? = null

  @Field val disabledTextColor: Color? = null

  @Field val disabledContainerColor: Color? = null

  @Field val disabledLeadingIconColor: Color? = null

  @Field val disabledTrailingContentColor: Color? = null

  @Field val selectedTextColor: Color? = null

  @Field val selectedContainerColor: Color? = null

  @Field val selectedLeadingIconColor: Color? = null

  @Field val selectedTrailingContentColor: Color? = null
}

@OptimizedComposeProps
data class SelectableDropdownMenuItemProps(
  val selected: Boolean = false,
  val shapes: MenuShapePosition? = null,
  val enabled: Boolean = true,
  val colors: SelectableDropdownMenuItemColors = SelectableDropdownMenuItemColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.SelectableDropdownMenuItemContent(
  props: SelectableDropdownMenuItemProps,
  onItemPressed: () -> Unit
) {
  val textSlotView = findChildSlotView(view, "text")
  val leadingSlotView = findChildSlotView(view, "leadingIcon")
  val selectedLeadingSlotView = findChildSlotView(view, "selectedLeadingIcon")
  val trailingSlotView = findChildSlotView(view, "trailingContent")
  val supportingTextSlotView = findChildSlotView(view, "supportingText")
  val colors = props.colors

  SelectableDropdownMenuItem(
    selected = props.selected,
    onClick = { onItemPressed() },
    text = { textSlotView?.renderSlot() },
    shapes = props.shapes?.let { MenuDefaults.itemShape(index = it.index, count = it.count) } ?: MenuDefaults.itemShapes(),
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    leadingIcon = leadingSlotView?.let { { it.renderSlot() } },
    selectedLeadingIcon = selectedLeadingSlotView?.let { { it.renderSlot() } },
    trailingContent = trailingSlotView?.let { { it.renderSlot() } },
    supportingText = supportingTextSlotView?.let { { it.renderSlot() } },
    enabled = props.enabled,
    colors = MenuDefaults.selectableItemColors(
      textColor = colors.textColor.compose,
      containerColor = colors.containerColor.compose,
      leadingIconColor = colors.leadingIconColor.compose,
      trailingContentColor = colors.trailingContentColor.compose,
      disabledTextColor = colors.disabledTextColor.compose,
      disabledContainerColor = colors.disabledContainerColor.compose,
      disabledLeadingIconColor = colors.disabledLeadingIconColor.compose,
      disabledTrailingContentColor = colors.disabledTrailingContentColor.compose,
      selectedTextColor = colors.selectedTextColor.compose,
      selectedContainerColor = colors.selectedContainerColor.compose,
      selectedLeadingIconColor = colors.selectedLeadingIconColor.compose,
      selectedTrailingContentColor = colors.selectedTrailingContentColor.compose
    )
  )
}
