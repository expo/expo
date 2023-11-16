package expo.modules.image.records

import android.content.Context
import android.net.Uri
import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.load.model.Headers
import com.bumptech.glide.load.model.LazyHeaders
import com.bumptech.glide.request.RequestOptions
import com.bumptech.glide.signature.ApplicationVersionSignature
import expo.modules.image.GlideBlurhashModel
import expo.modules.image.GlideModel
import expo.modules.image.GlideRawModel
import expo.modules.image.GlideThumbhashModel
import expo.modules.image.GlideUriModel
import expo.modules.image.GlideUrlModel
import expo.modules.image.ResourceIdHelper
import expo.modules.image.okhttp.GlideUrlWithCustomCacheKey
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class SourceMap(
  @Field val uri: String? = null,
  @Field val width: Int = 0,
  @Field val height: Int = 0,
  @Field val scale: Double = 1.0,
  @Field val headers: Map<String, String>? = null,
  @Field val cacheKey: String? = null
) : Record {
  private var parsedUri: Uri? = null

  private fun isDataUrl() = parsedUri?.scheme?.startsWith("data") ?: false

  private fun isContentUrl() = parsedUri?.scheme?.startsWith("content") ?: false

  private fun isResourceUri() = parsedUri?.scheme?.startsWith("android.resource") ?: false

  private fun isLocalResourceUri() = parsedUri?.scheme?.startsWith("res") ?: false

  private fun isLocalFileUri() = parsedUri?.scheme?.startsWith("file") ?: false

  fun isBlurhash() = parsedUri?.scheme?.startsWith("blurhash") ?: false

  fun isThumbhash() = parsedUri?.scheme?.startsWith("thumbhash") ?: false

  internal fun createGlideModel(context: Context): GlideModel? {
    if (uri.isNullOrBlank()) {
      return null
    }

    if (parsedUri == null) {
      parsedUri = computeUri(context)
    }

    if (isContentUrl() || isDataUrl()) {
      return GlideRawModel(uri)
    }

    if (isBlurhash()) {
      return GlideBlurhashModel(
        parsedUri!!,
        width,
        height
      )
    }

    if (isThumbhash()) {
      return GlideThumbhashModel(
        parsedUri!!
      )
    }

    if (isResourceUri()) {
      return GlideUriModel(parsedUri!!)
    }

    if (isLocalResourceUri()) {
      return GlideUriModel(
        // Convert `res:/` scheme to `android.resource://`.
        // Otherwise, glide can't understand the Uri.
        Uri.parse(parsedUri!!.toString().replace("res:/", "android.resource://" + context.packageName + "/"))
      )
    }

    if (isLocalFileUri()) {
      return GlideRawModel(parsedUri!!.toString())
    }

    val glideUrl = if (cacheKey == null) {
      GlideUrl(uri, getCustomHeaders())
    } else {
      GlideUrlWithCustomCacheKey(uri, getCustomHeaders(), cacheKey)
    }
    return GlideUrlModel(glideUrl)
  }

  internal fun createOptions(context: Context): RequestOptions {
    return RequestOptions()
      .apply {
        if (parsedUri == null) {
          parsedUri = computeUri(context)
        }

        // Override the size for local assets (apart from SVGs). This ensures that
        // resizeMode "center" displays the image in the correct size.
        if (width != 0 && height != 0) {
          override((width * scale).toInt(), (height * scale).toInt())
        }

        if (isResourceUri()) {
          // Every local resource (drawable) in Android has its own unique numeric id, which are
          // generated at build time. Although these ids are unique, they are not guaranteed unique
          // across builds. The underlying glide implementation caches these resources. To make
          // sure the cache does not return the wrong image, we should clear the cache when the
          // application version changes.
          apply(
            RequestOptions.signatureOf(ApplicationVersionSignature.obtain(context))
          )
        }
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

  internal val pixelCount: Double
    get() = width * height * scale * scale
}
