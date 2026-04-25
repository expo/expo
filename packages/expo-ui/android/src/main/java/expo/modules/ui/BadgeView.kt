package expo.modules.ui

import android.graphics.Color
import androidx.compose.foundation.layout.Box
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgeDefaults
import androidx.compose.material3.contentColorFor
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.layout
import androidx.compose.ui.unit.dp
import androidx.core.view.size
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedComposeProps
data class BadgeProps(
  val containerColor: Color? = null,
  val contentColor: Color? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.BadgeContent(props: BadgeProps) {
  val resolvedContainerColor = props.containerColor.composeOrNull ?: BadgeDefaults.containerColor
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  if (view.size > 0) {
    Badge(
      modifier = modifier,
      containerColor = resolvedContainerColor,
      contentColor = props.contentColor.composeOrNull ?: contentColorFor(resolvedContainerColor)
    ) {
      Box(
        modifier = Modifier.ensureBadgeContentCircular(),
        contentAlignment = Alignment.Center
      ) {
        Children(UIComposableScope())
      }
    }
  } else {
    // No content lambda → renders as small 6dp dot per M3 spec
    Badge(
      modifier = modifier,
      containerColor = resolvedContainerColor
    )
  }
}

/**
 * Layout modifier that sizes the Badge content so the Badge renders as a circle
 * for narrow content (single digits). Badge internally adds 4dp horizontal padding
 * on each side (8dp total) but no vertical padding. To make the Badge square
 * (and thus circular with CornerFull shape), the content width must be
 * `height - totalHorizontalPadding`. For wide content (e.g. "999+"), the natural
 * width is used, producing a pill shape.
 *
 * This is a workaround for Compose Badge becoming oval at font scales > 1.0.
 * @see: https://issuetracker.google.com/issues/365493087
 */
private fun Modifier.ensureBadgeContentCircular() = layout { measurable, constraints ->
  val placeable = measurable.measure(constraints)
  // Badge adds 4dp padding on each side = 8dp total horizontal padding
  val targetWidth = placeable.height - BadgeHorizontalPaddingTotal.roundToPx()
  val width = maxOf(placeable.width, targetWidth)
  layout(width, placeable.height) {
    placeable.placeRelative((width - placeable.width) / 2, 0)
  }
}

// Badge internal horizontal padding: 4dp per side = 8dp total
// (BadgeWithContentHorizontalPadding is internal in Material 3)
private val BadgeHorizontalPaddingTotal = 8.dp
