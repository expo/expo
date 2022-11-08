package expo.modules.image

import android.util.Log
import com.bumptech.glide.Glide
import com.bumptech.glide.load.model.GlideUrl
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.Spacing
import com.facebook.react.uimanager.ViewProps
import com.facebook.yoga.YogaConstants
import expo.modules.core.errors.ModuleDestroyedException
import expo.modules.image.enums.ImageResizeMode
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

private val borderRadiusToIndex = mapOf(
  ViewProps.BORDER_RADIUS to 0,
  ViewProps.BORDER_TOP_LEFT_RADIUS to 1,
  ViewProps.BORDER_TOP_RIGHT_RADIUS to 2,
  ViewProps.BORDER_BOTTOM_RIGHT_RADIUS to 3,
  ViewProps.BORDER_BOTTOM_LEFT_RADIUS to 4,
  ViewProps.BORDER_TOP_START_RADIUS to 5,
  ViewProps.BORDER_TOP_END_RADIUS to 6,
  ViewProps.BORDER_BOTTOM_START_RADIUS to 7,
  ViewProps.BORDER_BOTTOM_END_RADIUS to 8
)

private val borderWidthToBorderLocations = mapOf(
  ViewProps.BORDER_WIDTH to Spacing.ALL,
  ViewProps.BORDER_LEFT_WIDTH to Spacing.LEFT,
  ViewProps.BORDER_RIGHT_WIDTH to Spacing.RIGHT,
  ViewProps.BORDER_TOP_WIDTH to Spacing.TOP,
  ViewProps.BORDER_BOTTOM_WIDTH to Spacing.BOTTOM,
  ViewProps.BORDER_START_WIDTH to Spacing.START,
  ViewProps.BORDER_END_WIDTH to Spacing.END
)

private val borderColorToBorderLocations = mapOf(
  ViewProps.BORDER_COLOR to Spacing.ALL,
  ViewProps.BORDER_LEFT_COLOR to Spacing.LEFT,
  ViewProps.BORDER_RIGHT_COLOR to Spacing.RIGHT,
  ViewProps.BORDER_TOP_COLOR to Spacing.TOP,
  ViewProps.BORDER_BOTTOM_COLOR to Spacing.BOTTOM,
  ViewProps.BORDER_START_COLOR to Spacing.START,
  ViewProps.BORDER_END_COLOR to Spacing.END
)

private fun getBorderRadiusIndex(border: String) = borderRadiusToIndex[border]!!

private fun getBorderLocationFromBorderWidth(borderWidth: String) = borderWidthToBorderLocations[borderWidth]!!

private fun getBorderLocationFromBorderColor(borderColor: String) = borderColorToBorderLocations[borderColor]!!

class ExpoImageModule : Module() {
  private val moduleCoroutineScope = CoroutineScope(Dispatchers.IO)

  override fun definition() = ModuleDefinition {
    Name("ExpoImage")

    AsyncFunction("prefetch") { url: String, promise: Promise ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      moduleCoroutineScope.launch {
        try {
          val glideUrl = GlideUrl(url)
          val result = Glide.with(context)
            .download(glideUrl)
            .submit()
            .awaitGet()
          if (result != null) {
            promise.resolve(null)
          } else {
            promise.reject(ImagePrefetchFailure("cannot download $url"))
          }
        } catch (e: Exception) {
          promise.reject(ImagePrefetchFailure(e.message ?: e.toString()))
        }
      }
    }

    OnDestroy {
      try {
        moduleCoroutineScope.cancel(ModuleDestroyedException())
      } catch (e: IllegalStateException) {
        Log.w("ExpoImageModule", "No coroutines to cancel")
      }
    }

    View(ExpoImageViewWrapper::class) {
      Events(
        "onLoadStart",
        "onProgress",
        "onError",
        "onLoad"
      )

      Prop("source") { view: ExpoImageViewWrapper, sourceMap: ReadableMap? ->
        view.sourceMap = sourceMap
      }

      Prop("resizeMode") { view: ExpoImageViewWrapper, stringValue: String ->
        val resizeMode = ImageResizeMode.fromStringValue(stringValue)
        view.resizeMode = resizeMode
      }

      Prop("blurRadius") { view: ExpoImageViewWrapper, blurRadius: Int ->
        view.blurRadius = blurRadius
      }

      Prop("fadeDuration") { view: ExpoImageViewWrapper, fadeDuration: Int ->
        view.fadeDuration = fadeDuration
      }

      Prop(ViewProps.BORDER_RADIUS) { view: ExpoImageViewWrapper, borderRadius: Float? ->
        setBorderRadius(view, ViewProps.BORDER_RADIUS, borderRadius)
      }

      Prop(ViewProps.BORDER_TOP_LEFT_RADIUS) { view: ExpoImageViewWrapper, borderRadius: Float? ->
        setBorderRadius(view, ViewProps.BORDER_TOP_LEFT_RADIUS, borderRadius)
      }

      Prop(ViewProps.BORDER_TOP_RIGHT_RADIUS) { view: ExpoImageViewWrapper, borderRadius: Float? ->
        setBorderRadius(view, ViewProps.BORDER_TOP_RIGHT_RADIUS, borderRadius)
      }

      Prop(ViewProps.BORDER_BOTTOM_RIGHT_RADIUS) { view: ExpoImageViewWrapper, borderRadius: Float? ->
        setBorderRadius(view, ViewProps.BORDER_BOTTOM_RIGHT_RADIUS, borderRadius)
      }

      Prop(ViewProps.BORDER_BOTTOM_LEFT_RADIUS) { view: ExpoImageViewWrapper, borderRadius: Float? ->
        setBorderRadius(view, ViewProps.BORDER_BOTTOM_LEFT_RADIUS, borderRadius)
      }

      Prop(ViewProps.BORDER_TOP_START_RADIUS) { view: ExpoImageViewWrapper, borderRadius: Float? ->
        setBorderRadius(view, ViewProps.BORDER_TOP_START_RADIUS, borderRadius)
      }

      Prop(ViewProps.BORDER_TOP_END_RADIUS) { view: ExpoImageViewWrapper, borderRadius: Float? ->
        setBorderRadius(view, ViewProps.BORDER_TOP_END_RADIUS, borderRadius)
      }

      Prop(ViewProps.BORDER_BOTTOM_START_RADIUS) { view: ExpoImageViewWrapper, borderRadius: Float? ->
        setBorderRadius(view, ViewProps.BORDER_BOTTOM_START_RADIUS, borderRadius)
      }

      Prop(ViewProps.BORDER_BOTTOM_END_RADIUS) { view: ExpoImageViewWrapper, borderRadius: Float? ->
        setBorderRadius(view, ViewProps.BORDER_BOTTOM_END_RADIUS, borderRadius)
      }

      Prop(ViewProps.BORDER_WIDTH) { view: ExpoImageViewWrapper, width: Float? ->
        setBorderWidth(view, ViewProps.BORDER_WIDTH, width)
      }

      Prop(ViewProps.BORDER_LEFT_WIDTH) { view: ExpoImageViewWrapper, width: Float? ->
        setBorderWidth(view, ViewProps.BORDER_LEFT_WIDTH, width)
      }

      Prop(ViewProps.BORDER_RIGHT_WIDTH) { view: ExpoImageViewWrapper, width: Float? ->
        setBorderWidth(view, ViewProps.BORDER_RIGHT_WIDTH, width)
      }

      Prop(ViewProps.BORDER_TOP_WIDTH) { view: ExpoImageViewWrapper, width: Float? ->
        setBorderWidth(view, ViewProps.BORDER_TOP_WIDTH, width)
      }

      Prop(ViewProps.BORDER_BOTTOM_WIDTH) { view: ExpoImageViewWrapper, width: Float? ->
        setBorderWidth(view, ViewProps.BORDER_BOTTOM_WIDTH, width)
      }

      Prop(ViewProps.BORDER_START_WIDTH) { view: ExpoImageViewWrapper, width: Float? ->
        setBorderWidth(view, ViewProps.BORDER_START_WIDTH, width)
      }

      Prop(ViewProps.BORDER_END_WIDTH) { view: ExpoImageViewWrapper, width: Float? ->
        setBorderWidth(view, ViewProps.BORDER_END_WIDTH, width)
      }

      Prop(ViewProps.BORDER_COLOR) { view: ExpoImageViewWrapper, color: Int? ->
        setBorderColor(view, ViewProps.BORDER_COLOR, color)
      }

      Prop(ViewProps.BORDER_LEFT_COLOR) { view: ExpoImageViewWrapper, color: Int? ->
        setBorderColor(view, ViewProps.BORDER_LEFT_COLOR, color)
      }

      Prop(ViewProps.BORDER_RIGHT_COLOR) { view: ExpoImageViewWrapper, color: Int? ->
        setBorderColor(view, ViewProps.BORDER_RIGHT_COLOR, color)
      }

      Prop(ViewProps.BORDER_TOP_COLOR) { view: ExpoImageViewWrapper, color: Int? ->
        setBorderColor(view, ViewProps.BORDER_TOP_COLOR, color)
      }

      Prop(ViewProps.BORDER_BOTTOM_COLOR) { view: ExpoImageViewWrapper, color: Int? ->
        setBorderColor(view, ViewProps.BORDER_BOTTOM_COLOR, color)
      }

      Prop(ViewProps.BORDER_START_COLOR) { view: ExpoImageViewWrapper, color: Int? ->
        setBorderColor(view, ViewProps.BORDER_START_COLOR, color)
      }

      Prop(ViewProps.BORDER_END_COLOR) { view: ExpoImageViewWrapper, color: Int? ->
        setBorderColor(view, ViewProps.BORDER_END_COLOR, color)
      }

      Prop("borderStyle") { view: ExpoImageViewWrapper, borderStyle: String? ->
        view.setBorderStyle(borderStyle)
      }

      Prop("tintColor") { view: ExpoImageViewWrapper, color: Int? ->
        view.setTintColor(color)
      }

      Prop("defaultSource") { view: ExpoImageViewWrapper, defaultSource: ReadableMap? ->
        view.defaultSourceMap = defaultSource
      }

      Prop("accessible") { view: ExpoImageViewWrapper, accessible: Boolean ->
        view.isFocusable = accessible
      }

      OnViewDidUpdateProps { view: ExpoImageViewWrapper ->
        view.onAfterUpdateTransaction()
      }

      OnViewDestroys { view: ExpoImageViewWrapper ->
        view.onDrop()
      }
    }
  }

  private fun setBorderRadius(view: ExpoImageViewWrapper, border: String, borderRadius: Float?) {
    val index = getBorderRadiusIndex(border)
    val radius = makeYogaUndefinedIfNegative(borderRadius ?: YogaConstants.UNDEFINED)
    view.setBorderRadius(index, radius)
  }

  private fun setBorderWidth(view: ExpoImageViewWrapper, borderWidth: String, width: Float?) {
    val location = getBorderLocationFromBorderWidth(borderWidth)
    val pixelWidth = makeYogaUndefinedIfNegative(width ?: YogaConstants.UNDEFINED)
      .ifYogaDefinedUse(PixelUtil::toPixelFromDIP)
    view.setBorderWidth(location, pixelWidth)
  }

  private fun setBorderColor(view: ExpoImageViewWrapper, borderColor: String, color: Int?) {
    val location = getBorderLocationFromBorderColor(borderColor)
    val rgbComponent = if (color == null) YogaConstants.UNDEFINED else (color and 0x00FFFFFF).toFloat()
    val alphaComponent = if (color == null) YogaConstants.UNDEFINED else (color ushr 24).toFloat()
    view.setBorderColor(location, rgbComponent, alphaComponent)
  }
}
