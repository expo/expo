package expo.modules.ui.menu

import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.ExposedDropdownMenuBoxComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedComposeProps
data class ExposedDropdownMenuBoxProps(
  val expanded: Boolean = false,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunctionalComposableScope.ExposedDropdownMenuBoxContent(
  props: ExposedDropdownMenuBoxProps,
  onExpandedChange: (Boolean) -> Unit
) {
  ExposedDropdownMenuBox(
    expanded = props.expanded,
    onExpandedChange = onExpandedChange,
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(ExposedDropdownMenuBoxComposableScope(this))
  }
}
