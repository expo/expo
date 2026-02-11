package expo.modules.ui

import androidx.compose.material3.HorizontalDivider
import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

data class DividerProps(
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.DividerContent(props: DividerProps) {
  HorizontalDivider(modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope))
}
