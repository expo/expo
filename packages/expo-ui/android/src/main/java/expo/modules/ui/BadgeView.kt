package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgeDefaults
import androidx.compose.material3.contentColorFor
import androidx.compose.runtime.Composable
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
      Children(ComposableScope())
    }
  } else {
    // No content lambda → renders as small 6dp dot per M3 spec
    Badge(
      modifier = modifier,
      containerColor = resolvedContainerColor
    )
  }
}
