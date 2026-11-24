package expo.modules.ui.menu

import android.graphics.Color
import androidx.compose.material3.DropdownMenuGroup
import androidx.compose.material3.MenuDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.UIComposableScope
import expo.modules.ui.composeOrNull

@OptimizedComposeProps
data class DropdownMenuGroupProps(
  val shapes: MenuShapePosition? = null,
  val containerColor: Color? = null,
  val tonalElevation: Float? = null,
  val shadowElevation: Float? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.DropdownMenuGroupContent(props: DropdownMenuGroupProps) {
  DropdownMenuGroup(
    shapes = props.shapes?.let { MenuDefaults.groupShape(index = it.index, count = it.count) } ?: MenuDefaults.groupShapes(),
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    containerColor = props.containerColor.composeOrNull ?: MenuDefaults.groupStandardContainerColor,
    tonalElevation = props.tonalElevation?.dp ?: MenuDefaults.TonalElevation,
    shadowElevation = props.shadowElevation?.dp ?: MenuDefaults.ShadowElevation
  ) {
    Children(UIComposableScope(columnScope = this))
  }
}
