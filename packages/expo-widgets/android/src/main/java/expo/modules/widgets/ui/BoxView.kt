package expo.modules.widgets.ui

import androidx.compose.runtime.Composable
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import expo.modules.ui.LayoutProps
import expo.modules.ui.convertibles.ContentAlignment

@Composable
fun BoxView(
  props: LayoutProps,
  content: @Composable () -> Unit = {}
) {
  Box(
    modifier = props.modifiers.toGlanceModifier(),
    contentAlignment = props.contentAlignment?.toGlanceAlignment() ?: Alignment.TopStart,
  ) {
    content()
  }
}

private fun ContentAlignment.toGlanceAlignment(): Alignment {
  return when (this) {
    ContentAlignment.TOP_START -> Alignment.TopStart
    ContentAlignment.TOP_CENTER -> Alignment.TopCenter
    ContentAlignment.TOP_END -> Alignment.TopEnd
    ContentAlignment.CENTER_START -> Alignment.CenterStart
    ContentAlignment.CENTER -> Alignment.Center
    ContentAlignment.CENTER_END -> Alignment.CenterEnd
    ContentAlignment.BOTTOM_START -> Alignment.BottomStart
    ContentAlignment.BOTTOM_CENTER -> Alignment.BottomCenter
    ContentAlignment.BOTTOM_END -> Alignment.BottomEnd
  }
}
