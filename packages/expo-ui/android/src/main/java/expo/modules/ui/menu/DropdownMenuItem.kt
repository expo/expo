package expo.modules.ui.menu

import android.graphics.Color
import android.view.View
import android.view.ViewGroup
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MenuDefaults
import androidx.compose.material3.SelectableDropdownMenuItem
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color as ComposeColor
import androidx.core.view.size
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.ui.UIComposableScope
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.composeOrNull
import expo.modules.ui.findChildSlotView
import expo.modules.ui.renderSlot
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedRecord
class DropdownMenuItemColors : Record {
  @Field val textColor: Color? = null

  @Field val leadingIconColor: Color? = null

  @Field val trailingIconColor: Color? = null

  @Field val disabledTextColor: Color? = null

  @Field val disabledLeadingIconColor: Color? = null

  @Field val disabledTrailingIconColor: Color? = null
}

@OptimizedComposeProps
data class DropdownMenuItemProps(
  val enabled: Boolean = true,
  val selected: Boolean? = null,
  val elementColors: DropdownMenuItemColors = DropdownMenuItemColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

internal fun isMenuItem(view: Any?): Boolean {
  return (view as? ExpoComposeView<*>)?.props is DropdownMenuItemProps
}

/**
 * A submenu is a `DropdownMenu` whose trigger is a `DropdownMenuItem`. In a group, it takes the
 * place of an item.
 */
private fun isSubmenu(view: Any?): Boolean {
  return (view as? ExpoComposeView<*>)?.props is DropdownMenuProps
}

@Composable
fun FunctionalComposableScope.DropdownMenuItemContent(
  props: DropdownMenuItemProps,
  onItemPressed: () -> Unit
) {
  val textSlotView = findChildSlotView(view, "text")
  val leadingSlotView = findChildSlotView(view, "leadingIcon")
  val trailingSlotView = findChildSlotView(view, "trailingIcon")
  val selectedLeadingSlotView = findChildSlotView(view, "selectedLeadingIcon")

  val colors = props.elementColors
  val defaultColors = MenuDefaults.itemColors()

  // In a `DropdownMenuGroup`, the item is a Material 3 Expressive item, shaped by its position among the group's items.
  // A submenu's trigger item sits in its `DropdownMenu`, which is the group's child, so it takes that menu's position.
  val groupChild: View = (view.parent as? View)?.takeIf { isSubmenu(it) } ?: view
  val group = groupChild.parent as? ViewGroup
  if (group != null && isMenuGroup(group)) {
    val items = (0..<group.size).map { group.getChildAt(it) }.filter { isMenuItem(it) || isSubmenu(it) }
    val text: @Composable () -> Unit = { textSlotView?.renderSlot() }
    val leadingIcon = leadingSlotView?.let { slot -> @Composable { slot.renderSlot() } }
    val trailingContent = trailingSlotView?.let { slot -> @Composable { slot.renderSlot() } }
    val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
    val shapes = MenuDefaults.itemShape(index = items.indexOf(groupChild), count = items.size)
    val selected = props.selected

    if (selected != null) {
      SelectableDropdownMenuItem(
        selected = selected,
        onClick = { onItemPressed() },
        text = text,
        shapes = shapes,
        modifier = modifier,
        leadingIcon = leadingIcon,
        selectedLeadingIcon = selectedLeadingSlotView?.let { slot -> @Composable { slot.renderSlot() } },
        trailingContent = trailingContent,
        enabled = props.enabled,
        colors = MenuDefaults.selectableItemColors(
          textColor = colors.textColor.composeOrNull ?: ComposeColor.Unspecified,
          leadingIconColor = colors.leadingIconColor.composeOrNull ?: ComposeColor.Unspecified,
          trailingContentColor = colors.trailingIconColor.composeOrNull ?: ComposeColor.Unspecified,
          disabledTextColor = colors.disabledTextColor.composeOrNull ?: ComposeColor.Unspecified,
          disabledLeadingIconColor = colors.disabledLeadingIconColor.composeOrNull ?: ComposeColor.Unspecified,
          disabledTrailingContentColor = colors.disabledTrailingIconColor.composeOrNull ?: ComposeColor.Unspecified
        )
      )
    } else {
      DropdownMenuItem(
        onClick = { onItemPressed() },
        text = text,
        shape = shapes.shape,
        modifier = modifier,
        leadingIcon = leadingIcon,
        trailingContent = trailingContent,
        enabled = props.enabled,
        colors = MenuDefaults.itemColors(
          textColor = colors.textColor.composeOrNull ?: defaultColors.textColor,
          leadingIconColor = colors.leadingIconColor.composeOrNull ?: defaultColors.leadingIconColor,
          trailingIconColor = colors.trailingIconColor.composeOrNull ?: defaultColors.trailingIconColor,
          disabledTextColor = colors.disabledTextColor.composeOrNull ?: defaultColors.disabledTextColor,
          disabledLeadingIconColor = colors.disabledLeadingIconColor.composeOrNull ?: defaultColors.disabledLeadingIconColor,
          disabledTrailingIconColor = colors.disabledTrailingIconColor.composeOrNull ?: defaultColors.disabledTrailingIconColor
        )
      )
    }
    return
  }

  DropdownMenuItem(
    text = { textSlotView?.let { with(UIComposableScope()) { with(it) { Content() } } } ?: Unit },
    enabled = props.enabled,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    colors = MenuDefaults.itemColors(
      textColor = colors.textColor.composeOrNull ?: defaultColors.textColor,
      leadingIconColor = colors.leadingIconColor.composeOrNull ?: defaultColors.leadingIconColor,
      trailingIconColor = colors.trailingIconColor.composeOrNull ?: defaultColors.trailingIconColor,
      disabledTextColor = colors.disabledTextColor.composeOrNull ?: defaultColors.disabledTextColor,
      disabledLeadingIconColor = colors.disabledLeadingIconColor.composeOrNull ?: defaultColors.disabledLeadingIconColor,
      disabledTrailingIconColor = colors.disabledTrailingIconColor.composeOrNull ?: defaultColors.disabledTrailingIconColor
    ),
    leadingIcon = leadingSlotView?.let {
      { with(UIComposableScope()) { with(it) { Content() } } }
    },
    trailingIcon = trailingSlotView?.let {
      { with(UIComposableScope()) { with(it) { Content() } } }
    },
    onClick = {
      onItemPressed()
    }
  )
}
