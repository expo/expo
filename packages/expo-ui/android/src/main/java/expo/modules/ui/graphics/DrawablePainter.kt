package expo.modules.ui.graphics

import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.painter.BitmapPainter
import androidx.compose.ui.graphics.painter.Painter

@Composable
internal fun rememberDrawablePainter(drawable: Drawable?): Painter? {
  return remember(drawable) {
    when (drawable) {
      null -> null
      is BitmapDrawable -> BitmapPainter(drawable.bitmap.asImageBitmap())
      else -> DrawablePainter(drawable.mutate())
    }
  }
}

private class DrawablePainter(
  private val drawable: Drawable
) : Painter() {
  override val intrinsicSize: Size
    get() = Size(
      drawable.intrinsicWidth.toFloat().takeIf { it > 0 } ?: Size.Unspecified.width,
      drawable.intrinsicHeight.toFloat().takeIf { it > 0 } ?: Size.Unspecified.height
    )

  override fun DrawScope.onDraw() {
    drawIntoCanvas { canvas ->
      with(drawable) {
        setBounds(0, 0, size.width.toInt(), size.height.toInt())
        draw(canvas.nativeCanvas)
      }
    }
  }
}
