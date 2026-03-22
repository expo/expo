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
import androidx.core.view.size
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

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
      // Bridge-rendered text doesn't pick up the Badge's internal LabelSmall
      // typography, which can make it taller than wide. This layout modifier
      // ensures the width is at least as large as the height, so single-digit
      // badges render as circles. Multi-digit badges naturally grow wider.
      Box(
        modifier = Modifier.layout { measurable, constraints ->
          val placeable = measurable.measure(constraints)
          val width = maxOf(placeable.width, placeable.height)
          layout(width, placeable.height) {
            placeable.placeRelative((width - placeable.width) / 2, 0)
          }
        },
        contentAlignment = Alignment.Center
      ) {
        Children(ComposableScope())
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
