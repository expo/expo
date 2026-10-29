package expo.modules.ui.menu

import android.graphics.Color
import android.view.ViewGroup
import androidx.compose.material3.DropdownMenuGroup
import androidx.compose.material3.MenuDefaults
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.UIComposableScope
import expo.modules.ui.composeOrNull

@OptimizedComposeProps
data class DropdownMenuGroupProps(
  val color: Color? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

internal fun isMenuGroup(view: Any?): Boolean {
  return (view as? ExpoComposeView<*>)?.props is DropdownMenuGroupProps
}

@Composable
fun FunctionalComposableScope.DropdownMenuGroupContent(props: DropdownMenuGroupProps) {
  // Shaped by its position among the menu's groups, like `SegmentedButton` in its row.
  val parent = view.parent as? ViewGroup
  val index = parent?.indexOfChild(view) ?: 0
  val count = parent?.childCount ?: 1

  DropdownMenuGroup(
    shapes = MenuDefaults.groupShape(index = index, count = count),
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    containerColor = props.color.composeOrNull ?: MenuDefaults.groupStandardContainerColor
  ) {
    Children(UIComposableScope(columnScope = this))
  }
}
