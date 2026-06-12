package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarDefaults
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.contentColorFor
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color as ComposeColor
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedRecord
data class NavigationBarItemColors(
  @Field val selectedIconColor: Color? = null,
  @Field val selectedTextColor: Color? = null,
  @Field val selectedIndicatorColor: Color? = null,
  @Field val unselectedIconColor: Color? = null,
  @Field val unselectedTextColor: Color? = null,
  @Field val disabledIconColor: Color? = null,
  @Field val disabledTextColor: Color? = null
) : Record

@OptimizedComposeProps
data class NavigationBarProps(
  val containerColor: Color? = null,
  val contentColor: Color? = null,
  val tonalElevation: Float? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptimizedComposeProps
data class NavigationBarItemProps(
  val selected: Boolean = false,
  val enabled: Boolean = true,
  val alwaysShowLabel: Boolean = true,
  val colors: NavigationBarItemColors = NavigationBarItemColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.NavigationBarContent(props: NavigationBarProps) {
  val resolvedContainerColor = props.containerColor.composeOrNull ?: NavigationBarDefaults.containerColor
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  NavigationBar(
    modifier = modifier,
    containerColor = resolvedContainerColor,
    contentColor = props.contentColor.composeOrNull ?: contentColorFor(resolvedContainerColor),
    tonalElevation = props.tonalElevation?.dp ?: NavigationBarDefaults.Elevation
  ) {
    Children(UIComposableScope(rowScope = this@NavigationBar), filter = { !isSlotView(it) })
  }
}

@Composable
fun FunctionalComposableScope.NavigationBarItemContent(
  props: NavigationBarItemProps,
  onClick: () -> Unit
) {
  val iconSlotView = findChildSlotView(view, "icon")
  val labelSlotView = findChildSlotView(view, "label")
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  val label: (@Composable () -> Unit)? = labelSlotView?.let { slot -> { slot.renderSlot() } }
  val rowScope = composableScope.rowScope ?: return

  with(rowScope) {
    NavigationBarItem(
      selected = props.selected,
      onClick = onClick,
      icon = {
        iconSlotView?.renderSlot()
      },
      modifier = modifier,
      enabled = props.enabled,
      label = label,
      alwaysShowLabel = props.alwaysShowLabel,
      colors = NavigationBarItemDefaults.colors(
        selectedIconColor = props.colors.selectedIconColor.composeOrNull ?: ComposeColor.Unspecified,
        selectedTextColor = props.colors.selectedTextColor.composeOrNull ?: ComposeColor.Unspecified,
        indicatorColor = props.colors.selectedIndicatorColor.composeOrNull ?: ComposeColor.Unspecified,
        unselectedIconColor = props.colors.unselectedIconColor.composeOrNull ?: ComposeColor.Unspecified,
        unselectedTextColor = props.colors.unselectedTextColor.composeOrNull ?: ComposeColor.Unspecified,
        disabledIconColor = props.colors.disabledIconColor.composeOrNull ?: ComposeColor.Unspecified,
        disabledTextColor = props.colors.disabledTextColor.composeOrNull ?: ComposeColor.Unspecified
      )
    )
  }
}
