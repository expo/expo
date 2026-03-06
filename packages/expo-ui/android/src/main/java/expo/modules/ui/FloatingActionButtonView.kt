package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.FloatingActionButtonDefaults
import androidx.compose.material3.LargeFloatingActionButton
import androidx.compose.material3.SmallFloatingActionButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

enum class FloatingActionButtonSize(val value: String) : Enumerable {
  SMALL("small"),
  MEDIUM("medium"),
  LARGE("large")
}

data class FloatingActionButtonProps(
  val label: String? = null,
  val expanded: Boolean = true,
  val size: FloatingActionButtonSize = FloatingActionButtonSize.MEDIUM,
  val containerColor: Color? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.FloatingActionButtonContent(
  props: FloatingActionButtonProps,
  onPress: () -> Unit
) {
  val label = props.label
  val expanded = props.expanded
  val size = props.size
  val containerColor = props.containerColor?.compose ?: FloatingActionButtonDefaults.containerColor

  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  if (label != null) {
    ExtendedFloatingActionButton(
      onClick = onPress,
      expanded = expanded,
      icon = { Children(ComposableScope()) },
      text = { Text(label) },
      containerColor = containerColor,
      modifier = modifier
    )
  } else {
    when (size) {
      FloatingActionButtonSize.SMALL -> SmallFloatingActionButton(
        onClick = onPress,
        containerColor = containerColor,
        modifier = modifier,
        content = { Children(ComposableScope()) }
      )
      FloatingActionButtonSize.LARGE -> LargeFloatingActionButton(
        onClick = onPress,
        containerColor = containerColor,
        modifier = modifier,
        content = { Children(ComposableScope()) }
      )
      FloatingActionButtonSize.MEDIUM -> FloatingActionButton(
        onClick = onPress,
        containerColor = containerColor,
        modifier = modifier,
        content = { Children(ComposableScope()) }
      )
    }
  }
}
