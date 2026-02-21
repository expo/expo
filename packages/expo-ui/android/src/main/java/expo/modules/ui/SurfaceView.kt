package expo.modules.ui

import android.graphics.Color
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.contentColorFor
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope

data class SurfaceProps(
  val color: Color? = null,
  val contentColor: Color? = null,
  val tonalElevation: Float = 0f,
  val shadowElevation: Float = 0f,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.SurfaceContent(props: SurfaceProps) {
  val modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
  val color = props.color?.compose ?: MaterialTheme.colorScheme.surface
  val contentColor = props.contentColor?.compose ?: contentColorFor(color)

  Surface(
    modifier = modifier,
    color = color,
    contentColor = contentColor,
    tonalElevation = props.tonalElevation.dp,
    shadowElevation = props.shadowElevation.dp
  ) {
    Children(ComposableScope())
  }
}
