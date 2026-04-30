@file:OptIn(ExperimentalMaterial3ExpressiveApi::class)

package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.FloatingToolbarDefaults
import androidx.compose.material3.FloatingToolbarScrollBehavior
import androidx.compose.material3.HorizontalFloatingToolbar
import androidx.compose.runtime.Composable
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

enum class HorizontalFloatingToolbarVariant(val value: String) : Enumerable {
  STANDARD("standard"),
  VIBRANT("vibrant")
}

@OptimizedRecord
class HorizontalFloatingToolbarColors : Record {
  @Field val toolbarContainerColor: Color? = null
  @Field val toolbarContentColor: Color? = null
  @Field val fabContainerColor: Color? = null
  @Field val fabContentColor: Color? = null
}

@OptimizedComposeProps
data class HorizontalFloatingToolbarProps(
  val variant: HorizontalFloatingToolbarVariant? =
    HorizontalFloatingToolbarVariant.STANDARD,
  val colors: HorizontalFloatingToolbarColors = HorizontalFloatingToolbarColors(),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.HorizontalFloatingToolbarContent(props: HorizontalFloatingToolbarProps) {
  val colors = when (props.variant) {
    HorizontalFloatingToolbarVariant.VIBRANT -> FloatingToolbarDefaults.vibrantFloatingToolbarColors(
      toolbarContainerColor = props.colors.toolbarContainerColor.compose,
      toolbarContentColor = props.colors.toolbarContentColor.compose,
      fabContainerColor = props.colors.fabContainerColor.compose,
      fabContentColor = props.colors.fabContentColor.compose
    )
    else -> FloatingToolbarDefaults.standardFloatingToolbarColors(
      toolbarContainerColor = props.colors.toolbarContainerColor.compose,
      toolbarContentColor = props.colors.toolbarContentColor.compose,
      fabContainerColor = props.colors.fabContainerColor.compose,
      fabContentColor = props.colors.fabContentColor.compose
    )
  }

  // Find the FAB slot and extract its onClick handler
  val fabSlotView = findChildSlotView(view, "floatingActionButton")
  val fabOnClick: () -> Unit = {
    fabSlotView?.onSlotEvent?.invoke(Unit)
  }

  val floatingActionButton = @Composable {
    when (props.variant) {
      HorizontalFloatingToolbarVariant.VIBRANT -> FloatingToolbarDefaults.VibrantFloatingActionButton(
        onClick = fabOnClick,
        containerColor = colors.fabContainerColor,
        contentColor = colors.fabContentColor
      ) {
        Children(UIComposableScope(), filter = { isSlotWithName(it, "floatingActionButton") })
      }

      else -> FloatingToolbarDefaults.StandardFloatingActionButton(
        onClick = fabOnClick,
        containerColor = colors.fabContainerColor,
        contentColor = colors.fabContentColor
      ) {
        Children(UIComposableScope(), filter = { isSlotWithName(it, "floatingActionButton") })
      }
    }
  }

  val scrollBehavior = composableScope.nestedScrollConnection as? FloatingToolbarScrollBehavior
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  if (fabSlotView != null) {
    HorizontalFloatingToolbar(
      expanded = true,
      floatingActionButton = floatingActionButton,
      colors = colors,
      scrollBehavior = scrollBehavior,
      modifier = modifier,
    ) {
      Children(UIComposableScope(), filter = { !isSlotView(it) })
    }
  } else {
    HorizontalFloatingToolbar(
      expanded = true,
      colors = colors,
      scrollBehavior = scrollBehavior,
      modifier = modifier,
    ) {
      Children(UIComposableScope(), filter = { !isSlotView(it) })
    }
  }
}
