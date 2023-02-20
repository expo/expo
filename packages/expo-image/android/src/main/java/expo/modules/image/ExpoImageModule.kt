package expo.modules.image

import android.view.View
import com.bumptech.glide.Glide
import com.bumptech.glide.load.model.GlideUrl
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.Spacing
import com.facebook.react.uimanager.ViewProps
import com.facebook.yoga.YogaConstants
import expo.modules.image.enums.ContentFit
import expo.modules.image.enums.Priority
import expo.modules.image.records.CachePolicy
import expo.modules.image.records.ContentPosition
import expo.modules.image.records.ImageTransition
import expo.modules.image.records.SourceMap
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.views.ViewDefinitionBuilder

class ExpoImageModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoImage")

    Function("prefetch") { urls: List<String> ->
      val context = appContext.reactContext ?: return@Function
      urls.forEach {
        Glide
          .with(context)
          .download(GlideUrl(it))
          .submit()
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

    View(ExpoImageViewWrapper::class) {
      Events(
        "onLoadStart",
        "onProgress",
        "onError",
        "onLoad"
      )

      Prop("source") { view: ExpoImageViewWrapper, sources: List<SourceMap>? ->
        view.sources = sources ?: emptyList()
      }

      Prop("contentFit") { view: ExpoImageViewWrapper, contentFit: ContentFit? ->
        view.contentFit = contentFit ?: ContentFit.Cover
      }

      Prop("placeholderContentFit") { view: ExpoImageViewWrapper, placeholderContentFit: ContentFit? ->
        view.placeholderContentFit = placeholderContentFit ?: ContentFit.ScaleDown
      }

      Prop("contentPosition") { view: ExpoImageViewWrapper, contentPosition: ContentPosition? ->
        view.contentPosition = contentPosition ?: ContentPosition.center
      }

      Prop("blurRadius") { view: ExpoImageViewWrapper, blurRadius: Int? ->
        view.blurRadius = blurRadius?.takeIf { it > 0 }
      }

      Prop("transition") { view: ExpoImageViewWrapper, transition: ImageTransition? ->
        view.transition = transition
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
        view.setBorderRadius(index, radius)
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
        view.setBorderWidth(index, pixelWidth)
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
        view.setBorderColor(index, rgbComponent, alphaComponent)
      }

      Prop("borderStyle") { view: ExpoImageViewWrapper, borderStyle: String? ->
        view.borderStyle = borderStyle
      }

      Prop("backgroundColor") { view: ExpoImageViewWrapper, color: Int? ->
        view.backgroundColor = color
      }

      Prop("tintColor") { view: ExpoImageViewWrapper, color: Int? ->
        view.tintColor = color
      }

      Prop("placeholder") { view: ExpoImageViewWrapper, placeholder: List<SourceMap>? ->
        view.placeholders = placeholder ?: emptyList()
      }

      Prop("accessible") { view: ExpoImageViewWrapper, accessible: Boolean? ->
        view.accessible = accessible ?: false
      }

      Prop("accessibilityLabel") { view: ExpoImageViewWrapper, accessibilityLabel: String? ->
        view.accessibilityLabel = accessibilityLabel
      }

      Prop("focusable") { view: ExpoImageViewWrapper, isFocusable: Boolean? ->
        view.isFocusableProp = isFocusable ?: false
      }

      Prop("priority") { view: ExpoImageViewWrapper, priority: Priority? ->
        view.priority = priority ?: Priority.NORMAL
      }

      Prop("cachePolicy") { view: ExpoImageViewWrapper, cachePolicy: CachePolicy? ->
        view.cachePolicy = cachePolicy ?: CachePolicy.DISK
      }

      Prop("recyclingKey") { view: ExpoImageViewWrapper, recyclingKey: String? ->
        view.recyclingKey = recyclingKey
      }

      OnViewDidUpdateProps { view: ExpoImageViewWrapper ->
        view.rerenderIfNeeded()
      }

      OnViewDestroys { view: ExpoImageViewWrapper ->
        view.onViewDestroys()
      }
    }
  }
}

// TODO(@lukmccall): Remove when the same functionality will be defined by the expo-modules-core in SDK 48
@Suppress("FunctionName")
private inline fun <reified T : View, reified PropType, reified CustomValueType> ViewDefinitionBuilder<T>.PropGroup(
  vararg props: Pair<String, CustomValueType>,
  noinline body: (view: T, value: CustomValueType, prop: PropType) -> Unit
) {
  for ((name, value) in props) {
    Prop<T, PropType>(name) { view, prop -> body(view, value, prop) }
  }
}
