package expo.modules.ui.icon

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.net.Uri
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.painter.BitmapPainter
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.ui.ExpoModifier
import expo.modules.ui.compose
import expo.modules.ui.fromExpoModifiers
import okhttp3.OkHttpClient

data class Source(
  @Field val uri: String,
  @Field val width: Int = 0,
  @Field val height: Int = 0,
  @Field val scale: Double = 1.0
) : Record

data class IconProps(
  val source: MutableState<Source?> = mutableStateOf(null),
  val tintColor: MutableState<Color?> = mutableStateOf(null),
  val size: MutableState<Int?> = mutableStateOf(null),
  val contentDescription: MutableState<String?> = mutableStateOf(null),
  val modifiers: MutableState<List<ExpoModifier>> = mutableStateOf(emptyList())
) : ComposeProps

class IconView(context: Context, appContext: AppContext) :
  ExpoComposeView<IconProps>(context, appContext) {

  override val props = IconProps()

  private val iconLoader by lazy {
    VectorIconLoader(
      context = context,
      okHttpClient = OkHttpClient.Builder().build()
    )
  }

  @Composable
  override fun ComposableScope.Content() {
    val (source) = props.source
    val (tint) = props.tintColor
    val (iconSize) = props.size
    val (contentDescription) = props.contentDescription

    var imageVector by remember { mutableStateOf<ImageVector?>(null) }
    var drawable by remember { mutableStateOf<Drawable?>(null) }

    // Load icon from URI asynchronously
    LaunchedEffect(source) {
      imageVector = null
      drawable = null

      val uriString = source?.let { resolveUri(it) }
      if (uriString != null) {
        // loadFromUri is already a suspend function that handles dispatchers
        val result = iconLoader.loadFromUri(uriString)
        imageVector = result.imageVector
        drawable = result.drawable
      }
    }

    // Convert to Painter (prioritize ImageVector over Drawable)
    val painter = imageVector?.let { rememberVectorPainter(it) }
      ?: rememberDrawableAsPainter(drawable)

    // Render icon if painter available
    if (painter != null) {
      Icon(
        painter = painter,
        contentDescription = contentDescription,
        tint = tint?.compose ?: androidx.compose.ui.graphics.Color.Unspecified,
        modifier = Modifier
          .then(iconSize?.let { Modifier.size(it.dp) } ?: Modifier)
          .fromExpoModifiers(props.modifiers.value, this@Content)
      )
    }
  }

  /**
   * Resolve Source to URI string, handling resource IDs and local resources.
   */
  private fun resolveUri(source: Source): String? {
    val stringUri = source.uri
    return try {
      val uri = Uri.parse(stringUri)

      // If no scheme, try to resolve as local resource
      if (uri.scheme == null) {
        ResourceIdHelper.getResourceUri(context, stringUri)?.toString()
      } else {
        stringUri
      }
    } catch (e: Exception) {
      // Fallback to resource ID helper
      ResourceIdHelper.getResourceUri(context, stringUri)?.toString()
    }
  }

  @Composable
  private fun rememberDrawableAsPainter(drawable: Drawable?): Painter? {
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
}
