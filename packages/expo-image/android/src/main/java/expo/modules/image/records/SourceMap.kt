package expo.modules.image.records

import android.content.Context
import android.graphics.drawable.Drawable
import android.net.Uri
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.load.model.Headers
import com.bumptech.glide.load.model.LazyHeaders
import com.bumptech.glide.request.RequestOptions
import com.bumptech.glide.signature.ApplicationVersionSignature
import expo.modules.image.BlurhashModelProvider
import expo.modules.image.DecodedModelProvider
import expo.modules.image.GlideModelProvider
import expo.modules.image.RawModelProvider
import expo.modules.image.ThumbhashModelProvider
import expo.modules.image.UriModelProvider
import expo.modules.image.UrlModelProvider
import expo.modules.image.ResourceIdHelper
import expo.modules.image.customize
import expo.modules.image.okhttp.GlideUrlWithCustomCacheKey
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

sealed interface Source {
  val width: Int
  val height: Int
  val scale: Double

  val pixelCount: Double
    get() = width * height * scale * scale

  fun createGlideModelProvider(context: Context): GlideModelProvider?
  fun createGlideOptions(context: Context): RequestOptions

  /**
   * Whether it should use placeholder content fit when used as a placeholder
   */
  fun usesPlaceholderContentFit(): Boolean = true
}

class DecodedSource(
  val drawable: Drawable
) : Source {
  override fun createGlideModelProvider(context: Context): GlideModelProvider {
    return DecodedModelProvider(drawable)
  }

  override val width: Int = drawable.intrinsicWidth
  override val height: Int = drawable.intrinsicHeight
  override val scale: Double = 1.0

  override fun createGlideOptions(context: Context): RequestOptions {
    // We don't want to cache already decoded images.
    return RequestOptions()
      .skipMemoryCache(true)
      .diskCacheStrategy(DiskCacheStrategy.NONE)
  }
}

data class SourceMap(
  @Field val uri: String? = null,
  @Field override val width: Int = 0,
  @Field override val height: Int = 0,
  @Field override val scale: Double = 1.0,
  @Field val headers: Map<String, String>? = null,
  @Field val cacheKey: String? = null
) : Source, Record {
  private var parsedUri: Uri? = null

  private fun isDataUrl() = parsedUri?.scheme?.startsWith("data") ?: false

  private fun isContentUrl() = parsedUri?.scheme?.startsWith("content") ?: false

  private fun isResourceUri() = parsedUri?.scheme?.startsWith("android.resource") ?: false

  private fun isLocalResourceUri() = parsedUri?.scheme?.startsWith("res") ?: false

  private fun isLocalFileUri() = parsedUri?.scheme?.startsWith("file") ?: false

  private fun isBlurhash() = parsedUri?.scheme?.startsWith("blurhash") ?: false

  private fun isThumbhash() = parsedUri?.scheme?.startsWith("thumbhash") ?: false

  override fun usesPlaceholderContentFit(): Boolean {
    return !isBlurhash() && !isThumbhash()
  }

  private fun parseUri(context: Context) {
    if (parsedUri == null) {
      parsedUri = computeUri(context)
    }
  }

  override fun createGlideModelProvider(context: Context): GlideModelProvider? {
    if (uri.isNullOrBlank()) {
      return null
    }

    parseUri(context)
    if (isContentUrl() || isDataUrl()) {
      return RawModelProvider(uri)
    }

    if (isBlurhash()) {
      return BlurhashModelProvider(
        parsedUri!!,
        width,
        height
      )
    }

    if (isThumbhash()) {
      return ThumbhashModelProvider(
        parsedUri!!
      )
    }

    if (isResourceUri()) {
      return UriModelProvider(parsedUri!!)
    }

    if (isLocalResourceUri()) {
      return UriModelProvider(
        // Convert `res:/` scheme to `android.resource://`.
        // Otherwise, glide can't understand the Uri.
        Uri.parse(parsedUri!!.toString().replace("res:/", "android.resource://" + context.packageName + "/"))
      )
    }

    if (isLocalFileUri()) {
      return RawModelProvider(parsedUri!!.toString())
    }

    val glideUrl = if (cacheKey == null) {
      GlideUrl(uri, getCustomHeaders())
    } else {
      GlideUrlWithCustomCacheKey(uri, getCustomHeaders(), cacheKey)
    }
    return UrlModelProvider(glideUrl)
  }

  override fun createGlideOptions(context: Context): RequestOptions {
    parseUri(context)
    return RequestOptions().customize(`when` = width != 0 && height != 0) {
      // Override the size for local assets (apart from SVGs). This ensures that
      // resizeMode "center" displays the image in the correct size.
      override((width * scale).toInt(), (height * scale).toInt())
    }.customize(`when` = isResourceUri()) {
      // Every local resource (drawable) in Android has its own unique numeric id, which are
      // generated at build time. Although these ids are unique, they are not guaranteed unique
      // across builds. The underlying glide implementation caches these resources. To make
      // sure the cache does not return the wrong image, we should clear the cache when the
      // application version changes.
      apply(RequestOptions.signatureOf(ApplicationVersionSignature.obtain(context)))
    }
  }

  private fun getCustomHeaders(): Headers {
    if (headers == null) {
      return LazyHeaders.DEFAULT
    }

    return LazyHeaders
      .Builder()
      .apply {
        headers.forEach { (key, value) ->
          addHeader(key, value)
        }
      }
      .build()
  }

  private fun computeUri(context: Context): Uri? {
    val stringUri = uri ?: return null
    return try {
      val uri: Uri = Uri.parse(stringUri)
      // Verify scheme is set, so that relative uri (used by static resources) are not handled.
      if (uri.scheme == null) {
        computeLocalUri(stringUri, context)
      } else {
        uri
      }
    } catch (e: Exception) {
      computeLocalUri(stringUri, context)
    }
  }

  private fun computeLocalUri(stringUri: String, context: Context): Uri? {
    return ResourceIdHelper.getResourceUri(context, stringUri)
  }
}
