package expo.modules.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.layer.drawLayer
import androidx.compose.ui.graphics.rememberGraphicsLayer
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps
import expo.modules.ui.convertibles.ContentAlignment

@OptimizedComposeProps
data class MaskViewProps(
  val alignment: ContentAlignment = ContentAlignment.CENTER,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.MaskViewContent(props: MaskViewProps) {
  val maskSlotView = findChildSlotView(view, "content")
  val maskLayer = rememberGraphicsLayer().apply { blendMode = BlendMode.DstIn }

  Box(
    modifier = ModifierRegistry
      .applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
      .graphicsLayer { compositingStrategy = CompositingStrategy.Offscreen }
      .drawWithContent {
        drawContent()
        drawLayer(maskLayer)
      }
  ) {
    Children(UIComposableScope(), filter = { !isSlotView(it) })

    if (maskSlotView != null) {
      Box(
        modifier = Modifier
          .matchParentSize()
          .drawWithContent {
            maskLayer.record { this@drawWithContent.drawContent() }
          },
        contentAlignment = props.alignment.toComposeAlignment()
      ) {
        with(UIComposableScope()) {
          with(maskSlotView) {
            Content()
          }
        }
      }
    }
  }
}
