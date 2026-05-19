package expo.modules.widgets.ui

import androidx.compose.runtime.Composable
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps
import androidx.glance.text.Text

@OptimizedComposeProps
data class TextProps(
  val text: String = ""
) : ComposeProps

@Composable
fun FunctionalComposableScope.TextView(props: TextProps) {
    Text(props.text)
}