package expo.modules.ui

import androidx.compose.material3.LocalMinimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ProvidedValue
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedComposeProps
data class CompositionLocalProviderProps(
  val minimumInteractiveComponentSize: Float? = null
) : ComposeProps

@Composable
fun FunctionalComposableScope.CompositionLocalProviderContent(props: CompositionLocalProviderProps) {
  val values = buildList<ProvidedValue<*>> {
    props.minimumInteractiveComponentSize?.let { add(LocalMinimumInteractiveComponentSize provides it.dp) }
  }
  // Passes the parent's scope through, so children keep modifiers like `weight` from the surrounding layout.
  CompositionLocalProvider(*values.toTypedArray()) {
    Children(composableScope)
  }
}
