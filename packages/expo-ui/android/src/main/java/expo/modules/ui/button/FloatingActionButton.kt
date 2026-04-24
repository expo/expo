package expo.modules.ui.button

import android.graphics.Color
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.FloatingActionButtonDefaults
import androidx.compose.material3.LargeFloatingActionButton
import androidx.compose.material3.SmallFloatingActionButton
import androidx.compose.runtime.Composable
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.ui.UIComposableScope
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.compose
import expo.modules.ui.findChildSlotView
import expo.modules.kotlin.views.OptimizedComposeProps

enum class FloatingActionButtonVariant(val value: String) : Enumerable {
  SMALL("small"),
  MEDIUM("medium"),
  LARGE("large"),
  EXTENDED("extended")
}

@OptimizedComposeProps
data class FloatingActionButtonProps(
  val variant: FloatingActionButtonVariant = FloatingActionButtonVariant.MEDIUM,
  val expanded: Boolean = true,
  val containerColor: Color? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.FloatingActionButtonContent(
  props: FloatingActionButtonProps,
  onClick: () -> Unit
) {
  val containerColor = props.containerColor?.compose ?: FloatingActionButtonDefaults.containerColor
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  val iconSlotView = findChildSlotView(view, "icon")
  val iconContent: (@Composable () -> Unit) = iconSlotView?.let {
    {
      with(UIComposableScope()) {
        with(it) {
          Content()
        }
      }
    }
  } ?: {}

  when (props.variant) {
    FloatingActionButtonVariant.SMALL -> SmallFloatingActionButton(
      onClick = onClick,
      containerColor = containerColor,
      modifier = modifier,
      content = iconContent
    )
    FloatingActionButtonVariant.LARGE -> LargeFloatingActionButton(
      onClick = onClick,
      containerColor = containerColor,
      modifier = modifier,
      content = iconContent
    )
    FloatingActionButtonVariant.EXTENDED -> {
      val textSlotView = findChildSlotView(view, "text")
      val textContent: (@Composable () -> Unit) = textSlotView?.let {
        {
          with(UIComposableScope()) {
            with(it) {
              Content()
            }
          }
        }
      } ?: {}
      ExtendedFloatingActionButton(
        onClick = onClick,
        expanded = props.expanded,
        icon = iconContent,
        text = textContent,
        containerColor = containerColor,
        modifier = modifier
      )
    }
    FloatingActionButtonVariant.MEDIUM -> FloatingActionButton(
      onClick = onClick,
      containerColor = containerColor,
      modifier = modifier,
      content = iconContent
    )
  }
}
