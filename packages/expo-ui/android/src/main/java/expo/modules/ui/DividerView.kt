package expo.modules.ui

import androidx.compose.material3.HorizontalDivider
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoViewComposableScope

data class DividerProps(
  val modifiers: List<ModifierConfig> = emptyList()
) : ComposeProps

@Composable
fun ExpoViewComposableScope.DividerContent(props: DividerProps) {
  HorizontalDivider(modifier = ModifierRegistry.applyModifiers(props.modifiers))
}

