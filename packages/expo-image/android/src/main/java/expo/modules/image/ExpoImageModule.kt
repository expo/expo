package expo.modules.image

import android.util.Log
import android.view.View
import com.bumptech.glide.Glide
import com.bumptech.glide.load.model.GlideUrl
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.Spacing
import com.facebook.react.uimanager.ViewProps
import com.facebook.yoga.YogaConstants
import expo.modules.core.errors.ModuleDestroyedException
import expo.modules.image.enums.ImageResizeMode
import expo.modules.image.records.SourceMap
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.views.ViewDefinitionBuilder
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

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

    AsyncFunction("clearMemoryCache") {
      val activity = appContext.currentActivity ?: return@AsyncFunction false
      Glide.get(activity).clearMemory()
      return@AsyncFunction true
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("clearDiskCache") {
      val activity = appContext.currentActivity ?: return@AsyncFunction false
      activity.let {
        Glide.get(activity).clearDiskCache()
      }

      return@AsyncFunction true
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

      Prop("source") { view: ExpoImageViewWrapper, sourceMap: SourceMap? ->
        view.imageView.sourceMap = sourceMap
      }

      Prop("resizeMode") { view: ExpoImageViewWrapper, resizeMode: ImageResizeMode ->
        view.imageView.resizeMode = resizeMode
      }

      Prop("blurRadius") { view: ExpoImageViewWrapper, blurRadius: Int ->
        view.imageView.blurRadius = blurRadius
      }

      Prop("fadeDuration") { view: ExpoImageViewWrapper, fadeDuration: Int ->
        view.imageView.fadeDuration = fadeDuration
      }

      PropGroup(
        ViewProps.BORDER_RADIUS to 0,
        ViewProps.BORDER_TOP_LEFT_RADIUS to 1,
        ViewProps.BORDER_TOP_RIGHT_RADIUS to 2,
        ViewProps.BORDER_BOTTOM_RIGHT_RADIUS to 3,
        ViewProps.BORDER_BOTTOM_LEFT_RADIUS to 4,
        ViewProps.BORDER_TOP_START_RADIUS to 5,
        ViewProps.BORDER_TOP_END_RADIUS to 6,
        ViewProps.BORDER_BOTTOM_START_RADIUS to 7,
        ViewProps.BORDER_BOTTOM_END_RADIUS to 8
      ) { view: ExpoImageViewWrapper, index: Int, borderRadius: Float? ->
        val radius = makeYogaUndefinedIfNegative(borderRadius ?: YogaConstants.UNDEFINED)
        view.imageView.setBorderRadius(index, radius)
      }

      PropGroup(
        ViewProps.BORDER_WIDTH to Spacing.ALL,
        ViewProps.BORDER_LEFT_WIDTH to Spacing.LEFT,
        ViewProps.BORDER_RIGHT_WIDTH to Spacing.RIGHT,
        ViewProps.BORDER_TOP_WIDTH to Spacing.TOP,
        ViewProps.BORDER_BOTTOM_WIDTH to Spacing.BOTTOM,
        ViewProps.BORDER_START_WIDTH to Spacing.START,
        ViewProps.BORDER_END_WIDTH to Spacing.END
      ) { view: ExpoImageViewWrapper, index: Int, width: Float? ->
        val pixelWidth = makeYogaUndefinedIfNegative(width ?: YogaConstants.UNDEFINED)
          .ifYogaDefinedUse(PixelUtil::toPixelFromDIP)
        view.imageView.setBorderWidth(index, pixelWidth)
      }

      PropGroup(
        ViewProps.BORDER_COLOR to Spacing.ALL,
        ViewProps.BORDER_LEFT_COLOR to Spacing.LEFT,
        ViewProps.BORDER_RIGHT_COLOR to Spacing.RIGHT,
        ViewProps.BORDER_TOP_COLOR to Spacing.TOP,
        ViewProps.BORDER_BOTTOM_COLOR to Spacing.BOTTOM,
        ViewProps.BORDER_START_COLOR to Spacing.START,
        ViewProps.BORDER_END_COLOR to Spacing.END
      ) { view: ExpoImageViewWrapper, index: Int, color: Int? ->
        val rgbComponent = if (color == null) YogaConstants.UNDEFINED else (color and 0x00FFFFFF).toFloat()
        val alphaComponent = if (color == null) YogaConstants.UNDEFINED else (color ushr 24).toFloat()
        view.imageView.setBorderColor(index, rgbComponent, alphaComponent)
      }

      Prop("borderStyle") { view: ExpoImageViewWrapper, borderStyle: String? ->
        view.imageView.setBorderStyle(borderStyle)
      }

      Prop("tintColor") { view: ExpoImageViewWrapper, color: Int? ->
        view.imageView.setTintColor(color)
      }

      Prop("defaultSource") { view: ExpoImageViewWrapper, defaultSource: SourceMap? ->
        view.imageView.defaultSourceMap = defaultSource
      }

      Prop("accessible") { view: ExpoImageViewWrapper, accessible: Boolean ->
        view.imageView.isFocusable = accessible
      }

      OnViewDidUpdateProps { view: ExpoImageViewWrapper ->
        view.imageView.onAfterUpdateTransaction()
      }

      OnViewDestroys { view: ExpoImageViewWrapper ->
        view.imageView.onDrop()
      }
    }
  }
}

// TODO(@lukmccall): Remove when the same functionality will be defined by the expo-modules-core in SDK 48
private inline fun <reified T : View, reified PropType, reified CustomValueType> ViewDefinitionBuilder<T>.PropGroup(
  vararg props: Pair<String, CustomValueType>,
  noinline body: (view: T, value: CustomValueType, prop: PropType) -> Unit
) {
  for ((name, value) in props) {
    Prop<T, PropType>(name) { view, prop -> body(view, value, prop) }
  }
}
