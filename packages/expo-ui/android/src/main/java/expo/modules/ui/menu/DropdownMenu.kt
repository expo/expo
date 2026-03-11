package expo.modules.ui.menu

import androidx.compose.foundation.layout.Box
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.MenuDefaults
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.composeOrNull
import expo.modules.ui.findChildSlotView
import expo.modules.ui.isSlotView

@Composable
fun FunctionalComposableScope.DropdownMenuContent(
  props: DropdownMenuProps,
  onDismissRequest: () -> Unit
) {
  val itemsSlotView = findChildSlotView(view, "items")

  Box(modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)) {
    // Trigger - non-items children
    Children(ComposableScope(), filter = { !isSlotView(it) })

    DropdownMenu(
      containerColor = props.color?.composeOrNull ?: MenuDefaults.containerColor,
      expanded = props.expanded,
      onDismissRequest = onDismissRequest
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
