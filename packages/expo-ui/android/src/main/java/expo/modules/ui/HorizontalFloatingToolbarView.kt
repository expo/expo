@file:OptIn(ExperimentalMaterial3ExpressiveApi::class)

package expo.modules.ui

import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.FloatingToolbarDefaults
import androidx.compose.material3.FloatingToolbarScrollBehavior
import androidx.compose.material3.HorizontalFloatingToolbar
import androidx.compose.runtime.Composable
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

enum class HorizontalFloatingToolbarVariant(val value: String) : Enumerable {
  STANDARD("standard"),
  VIBRANT("vibrant")
}

@OptimizedComposeProps
data class HorizontalFloatingToolbarProps(
  val variant: HorizontalFloatingToolbarVariant? =
    HorizontalFloatingToolbarVariant.STANDARD,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.HorizontalFloatingToolbarContent(props: HorizontalFloatingToolbarProps) {
  val colors = when (props.variant) {
    HorizontalFloatingToolbarVariant.VIBRANT -> FloatingToolbarDefaults.vibrantFloatingToolbarColors()
    else -> FloatingToolbarDefaults.standardFloatingToolbarColors()
  }

  // Find the FAB slot and extract its onClick handler
  val fabSlotView = findChildSlotView(view, "floatingActionButton")
  val fabOnClick: () -> Unit = {
    fabSlotView?.onSlotEvent?.invoke(Unit)
  }

  val floatingActionButton = @Composable {
    when (props.variant) {
      HorizontalFloatingToolbarVariant.VIBRANT -> FloatingToolbarDefaults.VibrantFloatingActionButton(
        onClick = fabOnClick
      ) {
        Children(UIComposableScope(), filter = { isSlotWithName(it, "floatingActionButton") })
      }

      else -> FloatingToolbarDefaults.StandardFloatingActionButton(onClick = fabOnClick) {
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
