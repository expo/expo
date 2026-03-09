package expo.modules.ui.menu

import androidx.compose.foundation.layout.Box
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.MenuDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.snapshotFlow
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.composeOrNull
import expo.modules.ui.findChildSlotView
import expo.modules.ui.isSlotView

/**
 * CompositionLocal that allows child composables (like Button) to trigger ContextMenu expansion.
 * When a Button is inside a ContextMenu, it can use this to open the menu on click.
 */
val LocalContextMenuExpanded = compositionLocalOf<MutableState<Boolean>?> { null }

@Composable
fun FunctionalComposableScope.ContextMenuContent(
  props: ContextMenuProps,
  onExpandedChanged: (ExpandedChangedEvent) -> Unit
) {
  val expanded = remember { mutableStateOf(false) }
  val itemsSlotView = findChildSlotView(view, "items")

  // Observe expanded state changes from any source
  // TODO: move expanded logic to JS
  LaunchedEffect(Unit) {
    snapshotFlow { expanded.value }
      .collect { isExpanded ->
        onExpandedChanged(ExpandedChangedEvent(isExpanded))
      }
  }

  CompositionLocalProvider(LocalContextMenuExpanded provides expanded) {
    Box(modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)) {
      // Trigger - non-items children
      Children(ComposableScope(), filter = { !isSlotView(it) })

      DropdownMenu(
        containerColor = props.color?.composeOrNull ?: MenuDefaults.containerColor,
        expanded = expanded.value,
        onDismissRequest = {
          expanded.value = false
        }
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
}

data class ExpandedChangedEvent(
  @expo.modules.kotlin.records.Field val expanded: Boolean
) : Record
