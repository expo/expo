package expo.modules.ui

import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedComposeProps
data class BadgedBoxProps(
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.BadgedBoxContent(props: BadgedBoxProps) {
  val badgeSlot = findChildSlotView(view, "badge")

  BadgedBox(
    badge = { badgeSlot?.renderSlot() ?: Badge() },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  ) {
    Children(UIComposableScope()) { !isSlotView(it) }
  }
}
