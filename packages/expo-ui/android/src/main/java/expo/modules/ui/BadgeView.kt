package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgeDefaults
import androidx.compose.material3.contentColorFor
import androidx.compose.runtime.Composable
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

/**
 * Layout modifier that ensures width is at least as large as height.
 * Applied to the Badge composable so single-digit badges render as circles,
 * while multi-digit badges ("999+") naturally grow wider into a pill shape.
 *
 * Needed because bridge-rendered text doesn't pick up Badge's internal
 * LabelSmall typography, causing badges to be taller than wide.
 */
private fun Modifier.ensureMinWidthMatchesHeight() = layout { measurable, constraints ->
  val placeable = measurable.measure(constraints)
  val width = maxOf(placeable.width, placeable.height)
  layout(width, placeable.height) {
    placeable.placeRelative((width - placeable.width) / 2, 0)
  }
}

@Composable
fun FunctionalComposableScope.BadgeContent(props: BadgeProps) {
  val resolvedContainerColor = props.containerColor.composeOrNull ?: BadgeDefaults.containerColor
  val baseModifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)

  if (view.size > 0) {
    Badge(
      modifier = baseModifier.ensureMinWidthMatchesHeight(),
      containerColor = resolvedContainerColor,
      contentColor = props.contentColor.composeOrNull ?: contentColorFor(resolvedContainerColor)
    ) {
      Children(ComposableScope())
    }
  } else {
    // No content lambda → renders as small 6dp dot per M3 spec
    Badge(
      modifier = baseModifier,
      containerColor = resolvedContainerColor
    )
  }
}
