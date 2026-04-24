package expo.modules.ui.menu

import android.graphics.Color
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MenuDefaults
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.UIComposableScope
import expo.modules.ui.composeOrNull
import expo.modules.ui.exposedDropdownMenuBoxScope
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedComposeProps
data class ExposedDropdownMenuProps(
  val expanded: Boolean = false,
  val containerColor: Color? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FunctionalComposableScope.ExposedDropdownMenuContent(
  props: ExposedDropdownMenuProps,
  onDismissRequest: () -> Unit
) {
  val scope = composableScope.exposedDropdownMenuBoxScope
    ?: error("ExposedDropdownMenu can only be used inside ExposedDropdownMenuBox")

  with(scope) {
    ExposedDropdownMenu(
      expanded = props.expanded,
      onDismissRequest = onDismissRequest,
      containerColor = props.containerColor?.composeOrNull ?: MenuDefaults.containerColor,
      modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
    ) {
      Children(UIComposableScope())
    }
  }
}
