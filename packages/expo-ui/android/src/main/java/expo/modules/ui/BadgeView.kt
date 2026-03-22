package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgeDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.contentColorFor
import androidx.compose.runtime.Composable
import androidx.core.view.size
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

data class BadgeProps(
  val text: String? = null,
  val containerColor: Color? = null,
  val contentColor: Color? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.BadgeContent(props: BadgeProps) {
  val resolvedContainerColor = props.containerColor.composeOrNull ?: BadgeDefaults.containerColor
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  when {
    // Text prop: render native Compose Text so Badge's internal
    // ProvideContentColorTextStyle (LabelSmall) applies correctly
    props.text != null -> {
      Badge(
        modifier = modifier,
        containerColor = resolvedContainerColor,
        contentColor = props.contentColor.composeOrNull ?: contentColorFor(resolvedContainerColor)
      ) {
        Text(props.text)
      }
    }
    // Children via bridge (may not match Badge's internal text style exactly)
    view.size > 0 -> {
      Badge(
        modifier = modifier,
        containerColor = resolvedContainerColor,
        contentColor = props.contentColor.composeOrNull ?: contentColorFor(resolvedContainerColor)
      ) {
        Children(ComposableScope())
      }
    }
    // No content → small 6dp dot indicator
    else -> {
      Badge(
        modifier = modifier,
        containerColor = resolvedContainerColor
      )
    }
  }
}
