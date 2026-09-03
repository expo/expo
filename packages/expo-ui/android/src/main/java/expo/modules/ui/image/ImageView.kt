package expo.modules.ui.image

import android.content.Context
import android.graphics.Color
import androidx.compose.foundation.Image
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.painter.ColorPainter
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.layout.ContentScale
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.kotlin.views.OptimizedComposeProps
import expo.modules.ui.ExpoUIModule
import expo.modules.ui.ModifierList
import expo.modules.ui.ModifierRegistry
import expo.modules.ui.compose
import expo.modules.ui.convertibles.ContentAlignment
import expo.modules.ui.graphics.ImageLoader
import expo.modules.ui.graphics.ImageSource
import expo.modules.ui.graphics.rememberDrawablePainter
import expo.modules.ui.graphics.resolveUri

enum class ImageContentScale(val value: String) : Enumerable {
  FIT("fit"),
  CROP("crop"),
  FILL_BOUNDS("fillBounds"),
  FILL_WIDTH("fillWidth"),
  FILL_HEIGHT("fillHeight"),
  INSIDE("inside"),
  NONE("none");

  fun toComposeContentScale(): ContentScale {
    return when (this) {
      FIT -> ContentScale.Fit
      CROP -> ContentScale.Crop
      FILL_BOUNDS -> ContentScale.FillBounds
      FILL_WIDTH -> ContentScale.FillWidth
      FILL_HEIGHT -> ContentScale.FillHeight
      INSIDE -> ContentScale.Inside
      NONE -> ContentScale.None
    }
  }
}

@OptimizedRecord
data class ImageErrorEvent(
  @Field val error: String
) : Record

@OptimizedComposeProps
data class ImageProps(
  val source: MutableState<ImageSource?> = mutableStateOf(null),
  val contentScale: MutableState<ImageContentScale> = mutableStateOf(ImageContentScale.FIT),
  val alignment: MutableState<ContentAlignment> = mutableStateOf(ContentAlignment.CENTER),
  val contentDescription: MutableState<String?> = mutableStateOf(null),
  val tint: MutableState<Color?> = mutableStateOf(null),
  val alpha: MutableState<Float> = mutableStateOf(1f),
  val modifiers: MutableState<ModifierList> = mutableStateOf(emptyList())
) : ComposeProps

class ImageView(context: Context, appContext: AppContext) :
  ExpoComposeView<ImageProps>(context, appContext) {

  override val props = ImageProps()
  private val onLoad by EventDispatcher<Unit>()
  private val onError by EventDispatcher<ImageErrorEvent>()

  private val imageLoader by lazy {
    val module = appContext.registry.getModule<ExpoUIModule>()
    requireNotNull(module?.imageLoader) { "ExpoUIModule.imageLoader is not initialized" }
  }

  @Composable
  override fun ComposableScope.Content() {
    val (source) = props.source
    val (contentScale) = props.contentScale
    val (alignment) = props.alignment
    val (contentDescription) = props.contentDescription
    val (tint) = props.tint
    val (alpha) = props.alpha
    val (modifiers) = props.modifiers

    var loadedImage by remember(source) { mutableStateOf(ImageLoader.ImageResult()) }

    LaunchedEffect(source) {
      val resolvedUri = source?.resolveUri(context)
      if (resolvedUri == null) {
        val error = "Unable to resolve image source"
        loadedImage = ImageLoader.ImageResult(error = error)
        onError(ImageErrorEvent(error))
        return@LaunchedEffect
      }

      loadedImage = imageLoader.loadFromUri(resolvedUri).also { result ->
        if (result.isSuccess) {
          onLoad(Unit)
        } else {
          onError(ImageErrorEvent(result.error ?: "Failed to load image"))
        }
      }
    }

    val painter = loadedImage.imageVector?.let { rememberVectorPainter(it) }
      ?: rememberDrawablePainter(loadedImage.drawable)
      ?: remember { ColorPainter(androidx.compose.ui.graphics.Color.Transparent) }

    Image(
      painter = painter,
      contentDescription = contentDescription,
      contentScale = contentScale.toComposeContentScale(),
      alignment = alignment.toComposeAlignment(),
      colorFilter = tint?.compose?.let { ColorFilter.tint(it) },
      alpha = alpha.coerceIn(0f, 1f),
      modifier = ModifierRegistry.applyModifiers(
        modifiers,
        appContext,
        this@Content,
        globalEventDispatcher
      )
    )
  }
}
