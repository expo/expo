package expo.modules.ui

import android.graphics.Color
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgeDefaults
import androidx.compose.material3.contentColorFor
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
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
  val hasChildren = view.size > 0

  if (hasChildren) {
    Badge(
      modifier = modifier,
      containerColor = resolvedContainerColor,
      contentColor = props.contentColor.composeOrNull ?: contentColorFor(resolvedContainerColor)
    ) {
      // Wrap children in a Box with min size matching the large badge size (16dp).
      // Bridge-rendered text may not use the badge's internal text style, causing
      // the badge to be taller than wide. This ensures a square minimum.
      Box(
        modifier = Modifier.defaultMinSize(
          minWidth = LargeBadgeSize,
          minHeight = LargeBadgeSize
        ),
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

// M3 large badge size (BadgeTokens.LargeSize is internal)
private val LargeBadgeSize = 16.dp
