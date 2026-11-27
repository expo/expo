package expo.modules.ui

import android.graphics.Color
import androidx.compose.foundation.text.LocalAutofillHighlightBrush
import androidx.compose.material3.LocalMinimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ProvidedValue
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedComposeProps
data class CompositionLocalProviderProps(
  val minimumInteractiveComponentSize: Float? = null,
  val autofillHighlightColor: Color? = null
) : ComposeProps

@Composable
fun FunctionalComposableScope.CompositionLocalProviderContent(props: CompositionLocalProviderProps) {
  val values = buildList<ProvidedValue<*>> {
    props.minimumInteractiveComponentSize?.let { add(LocalMinimumInteractiveComponentSize provides it.dp) }
    props.autofillHighlightColor.composeOrNull?.let { add(LocalAutofillHighlightBrush provides SolidColor(it)) }
  }
  // Passes the parent's scope through, so children keep modifiers like `weight` from the surrounding layout.
  CompositionLocalProvider(*values.toTypedArray()) {
    Children(composableScope)
  }
}
