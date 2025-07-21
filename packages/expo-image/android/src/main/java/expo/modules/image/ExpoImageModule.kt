@file:OptIn(EitherType::class)

package expo.modules.image

import android.graphics.Bitmap
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.util.Base64
import androidx.core.graphics.drawable.toBitmap
import androidx.core.graphics.drawable.toBitmapOrNull
import androidx.core.view.doOnDetach
import com.bumptech.glide.Glide
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.engine.GlideException
import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.load.model.Headers
import com.bumptech.glide.load.model.LazyHeaders
import com.bumptech.glide.request.RequestListener
import com.bumptech.glide.request.target.Target
import com.github.penfeizhou.animation.apng.APNGDrawable
import com.github.penfeizhou.animation.gif.GifDrawable
import com.github.penfeizhou.animation.webp.WebPDrawable
import expo.modules.image.blurhash.BlurhashEncoder
import expo.modules.image.enums.ContentFit
import expo.modules.image.enums.Priority
import expo.modules.image.records.CachePolicy
import expo.modules.image.records.ContentPosition
import expo.modules.image.records.DecodeFormat
import expo.modules.image.records.DecodedSource
import expo.modules.image.records.ImageLoadOptions
import expo.modules.image.records.ImageTransition
import expo.modules.image.records.SourceMap
import expo.modules.image.thumbhash.ThumbhashEncoder
import expo.modules.kotlin.Promise
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.kotlin.types.Either
import expo.modules.kotlin.types.EitherOfThree
import expo.modules.kotlin.types.toKClass
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.URL

class ExpoImageModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoImage")

    OnCreate {
      appContext.reactContext?.registerComponentCallbacks(ExpoImageComponentCallbacks)
    }

    OnDestroy {
      appContext.reactContext?.unregisterComponentCallbacks(ExpoImageComponentCallbacks)
    }

    AsyncFunction("prefetch") { urls: List<String>, cachePolicy: CachePolicy, headersMap: Map<String, String>?, promise: Promise ->
      val context = appContext.reactContext ?: return@AsyncFunction false

      var imagesLoaded = 0
      var failed = false

      val headers = headersMap?.let {
        LazyHeaders.Builder().apply {
          it.forEach { (key, value) ->
            addHeader(key, value)
          }
        }.build()
      } ?: Headers.DEFAULT

      urls.forEach {
        Glide
          .with(context)
          .load(GlideUrl(it, headers)) //  Use `load` instead of `download` to store the asset in the memory cache
          // We added `quality` and `downsample` to create the same cache key as in final image load.
          .encodeQuality(100)
          .downsample(NoopDownsampleStrategy)
          .customize(`when` = cachePolicy == CachePolicy.MEMORY) {
            diskCacheStrategy(DiskCacheStrategy.NONE)
          }
          .listener(object : RequestListener<Drawable> {
            override fun onLoadFailed(
              e: GlideException?,
              model: Any?,
              target: Target<Drawable>,
              isFirstResource: Boolean
            ): Boolean {
              if (!failed) {
                failed = true
                promise.resolve(false)
              }
              return true
            }

            override fun onResourceReady(
              resource: Drawable,
              model: Any,
              target: Target<Drawable>,
              dataSource: DataSource,
              isFirstResource: Boolean
            ): Boolean {
              imagesLoaded++

              if (imagesLoaded == urls.size) {
                promise.resolve(true)
              }
              return true
            }
          })
          .submit()
      }
    }

    AsyncFunction("loadAsync") Coroutine { source: SourceMap, options: ImageLoadOptions? ->
      ImageLoadTask(appContext, source, options ?: ImageLoadOptions()).load()
    }

    suspend fun generatePlaceholder(
      source: Either<URL, Image>,
      encoder: (Bitmap) -> String
    ): String {
      val image = source.let {
        if (it.`is`(Image::class)) {
          it.get(Image::class)
        } else {
          ImageLoadTask(appContext, SourceMap(uri = it.get(URL::class).toString()), ImageLoadOptions()).load()
        }
      }
      return withContext(Dispatchers.Default) {
        encoder(image.ref.toBitmap())
      }
    }

    AsyncFunction("generateBlurhashAsync") Coroutine { source: Either<URL, Image>, numberOfComponents: Pair<Int, Int> ->
      generatePlaceholder(source) { bitmap ->
        BlurhashEncoder.encode(bitmap, numberOfComponents)
      }
    }

    AsyncFunction("generateThumbhashAsync") Coroutine { source: Either<URL, Image> ->
      generatePlaceholder(source) { bitmap ->
        Base64.encodeToString(
          ThumbhashEncoder.encode(bitmap),
          Base64.NO_WRAP
        )
      }
    }

    Class(Image::class) {
      Property("width") { image: Image ->
        image.ref.intrinsicWidth
      }
      Property("height") { image: Image ->
        image.ref.intrinsicHeight
      }
      Property("scale") { image: Image ->
        // Not relying on `2x` in the filename, but want to make the following true:
        //  If you multiply the logical size of the image by this value, you get the dimensions of the image in pixels.
        val screenDensity = appContext.reactContext?.resources?.displayMetrics?.density ?: 1f
        (image.ref.toBitmapOrNull()?.density ?: 1) / (screenDensity * 160.0f)
      }
      Property("isAnimated") { image: Image ->
        if (image.ref is GifDrawable) {
          return@Property true
        }
        if (image.ref is APNGDrawable) {
          return@Property true
        }
        if (image.ref is WebPDrawable) {
          return@Property true
        }
        false
      }
      Property<Any?>("mediaType") { ->
        null // not easily supported on Android https://github.com/bumptech/glide/issues/1378#issuecomment-236879983
      }
    }

    AsyncFunction("clearMemoryCache") {
      val activity = appContext.currentActivity ?: return@AsyncFunction false
      Glide.get(activity).clearMemory()
      return@AsyncFunction true
    }.runOnQueue(Queues.MAIN)

    AsyncFunction<Boolean>("clearDiskCache") {
      val activity = appContext.currentActivity ?: return@AsyncFunction false
      activity.let {
        Glide.get(activity).clearDiskCache()
      }

      return@AsyncFunction true
    }

    AsyncFunction("getCachePathAsync") { cacheKey: String ->
      val context = appContext.reactContext ?: return@AsyncFunction null

      val glideUrl = GlideUrl(cacheKey)
      val target = Glide.with(context).asFile().load(glideUrl).onlyRetrieveFromCache(true).submit()

      return@AsyncFunction try {
        val file = target.get()
        file.absolutePath
      } catch (_: Exception) {
        null
      }
    }

    View(ExpoImageViewWrapper::class) {
      Events(
        "onLoadStart",
        "onProgress",
        "onError",
        "onLoad",
        "onDisplay"
      )

      Prop("source") { view: ExpoImageViewWrapper, sources: EitherOfThree<List<SourceMap>, SharedRef<Drawable>, SharedRef<Bitmap>>? ->
        if (sources == null) {
          view.sources = emptyList()
          return@Prop
        }

        if (sources.`is`(toKClass<List<SourceMap>>())) {
          view.sources = sources.get(toKClass<List<SourceMap>>())
          return@Prop
        }

        if (sources.`is`(toKClass<SharedRef<Drawable>>())) {
          val drawable = sources.get(toKClass<SharedRef<Drawable>>()).ref
          view.sources = listOf(DecodedSource(drawable))
          return@Prop
        }

        val bitmap = sources.get(toKClass<SharedRef<Bitmap>>()).ref
        val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
        val drawable = BitmapDrawable(context.resources, bitmap)
        view.sources = listOf(DecodedSource(drawable))
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

      Prop("tintColor") { view: ExpoImageViewWrapper, color: Int? ->
        view.tintColor = color
      }

      Prop("placeholder") { view: ExpoImageViewWrapper, placeholder: List<SourceMap>? ->
        view.placeholders = placeholder ?: emptyList()
      }

      Prop("accessible") { view: ExpoImageViewWrapper, accessible: Boolean? ->
        view.accessible = accessible == true
      }

      Prop("accessibilityLabel") { view: ExpoImageViewWrapper, accessibilityLabel: String? ->
        view.accessibilityLabel = accessibilityLabel
      }

      Prop("focusable") { view: ExpoImageViewWrapper, isFocusable: Boolean? ->
        view.isFocusableProp = isFocusable == true
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

      Prop("allowDownscaling") { view: ExpoImageViewWrapper, allowDownscaling: Boolean? ->
        view.allowDownscaling = allowDownscaling != false
      }

      Prop("autoplay") { view: ExpoImageViewWrapper, autoplay: Boolean? ->
        view.autoplay = autoplay != false
      }

      Prop("decodeFormat") { view: ExpoImageViewWrapper, format: DecodeFormat? ->
        view.decodeFormat = format ?: DecodeFormat.ARGB_8888
      }

      AsyncFunction("startAnimating") { view: ExpoImageViewWrapper ->
        view.setIsAnimating(true)
      }

      AsyncFunction("stopAnimating") { view: ExpoImageViewWrapper ->
        view.setIsAnimating(false)
      }

      AsyncFunction("lockResourceAsync") { view: ExpoImageViewWrapper ->
        view.lockResource = true
      }

      AsyncFunction("unlockResourceAsync") { view: ExpoImageViewWrapper ->
        view.lockResource = false
      }

      AsyncFunction("reloadAsync") { view: ExpoImageViewWrapper ->
        view.shouldRerender = true
        view.rerenderIfNeeded(force = true)
      }

      OnViewDidUpdateProps { view: ExpoImageViewWrapper ->
        view.rerenderIfNeeded()
      }

      OnViewDestroys { view: ExpoImageViewWrapper ->
        view.doOnDetach {
          view.onViewDestroys()
        }
      }
    }
  }
}
