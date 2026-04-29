package expo.modules.ui

import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.RectF
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.nativeCanvas
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.ui.convertibles.ContentAlignment

data class MaskViewProps(
  val alignment: ContentAlignment = ContentAlignment.CENTER,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.MaskViewContent(props: MaskViewProps) {
  val maskSlotView = findChildSlotView(view, "content")

  Box(
    modifier = ModifierRegistry
      .applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher)
      .graphicsLayer { compositingStrategy = CompositingStrategy.Offscreen }
  ) {
    // Content children: the thing being masked.
    Children(ComposableScope(), filter = { !isSlotView(it) })

    // Mask: drawn on top with PorterDuff DST_IN via Canvas.saveLayer.
    if (maskSlotView != null) {
      Box(
        modifier = Modifier
          .matchParentSize()
          .drawWithContent {
            val canvas = drawContext.canvas.nativeCanvas
            val savePoint = canvas.saveLayer(
              RectF(0f, 0f, size.width, size.height),
              android.graphics.Paint().apply {
                xfermode = PorterDuffXfermode(PorterDuff.Mode.DST_IN)
              }
            )
            drawContent()
            canvas.restoreToCount(savePoint)
          },
        contentAlignment = props.alignment.toComposeAlignment()
      ) {
        with(ComposableScope()) {
          with(maskSlotView) {
            Content()
          }
        }
      }
    }
  }
}
