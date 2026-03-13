package expo.modules.ui

import androidx.compose.foundation.layout.Spacer
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

data class SpacerProps(
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.SpacerContent(props: SpacerProps) {
  Spacer(modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher))
}
