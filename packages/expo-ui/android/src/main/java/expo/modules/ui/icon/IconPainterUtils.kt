package expo.modules.ui.icon

import android.content.Context
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.painter.BitmapPainter
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.rememberVectorPainter

/**
 * Resolves a [Source] to a URI string suitable for [VectorIconLoader.loadFromUri].
 * Mirrors the logic in [IconView] to support resource IDs, file URIs, and remote URLs.
 */
fun resolveSourceUri(context: Context, source: Source): String? {
  val stringUri = source.uri
  return try {
    val uri = Uri.parse(stringUri)
    if (uri.scheme == null) {
      ResourceIdHelper.getResourceUri(context, stringUri)?.toString()
    } else {
      stringUri
    }
  } catch (e: Exception) {
    ResourceIdHelper.getResourceUri(context, stringUri)?.toString()
  }
}

/**
 * Returns a [Painter] for the given [ImageVector] or [Drawable], prioritising [ImageVector].
 */
@Composable
fun rememberIconPainter(imageVector: ImageVector?, drawable: Drawable?): Painter? {
  val vectorPainter = imageVector?.let { rememberVectorPainter(it) }
  return vectorPainter ?: rememberDrawableAsPainter(drawable)
}

@Composable
internal fun rememberDrawableAsPainter(drawable: Drawable?): Painter? {
  return remember(drawable) {
    when (drawable) {
      null -> null
      is BitmapDrawable -> BitmapPainter(drawable.bitmap.asImageBitmap())
      else -> DrawablePainter(drawable.mutate())
    }
  }
}

internal class DrawablePainter(
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
