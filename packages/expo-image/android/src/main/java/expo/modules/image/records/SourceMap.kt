package expo.modules.image.records

import android.content.Context
import android.net.Uri
import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.load.model.Headers
import com.bumptech.glide.load.model.LazyHeaders
import com.bumptech.glide.request.RequestOptions
import com.bumptech.glide.signature.ApplicationVersionSignature
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper
import expo.modules.image.GlideDataUrlModel
import expo.modules.image.GlideModel
import expo.modules.image.GlideOptions
import expo.modules.image.GlideUrlModel
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class SourceMap(
  @Field val uri: String? = null,
  @Field val width: Int = 0,
  @Field val height: Int = 0,
  @Field val scale: Double = 1.0,
  @Field val headers: Map<String, String>? = null
) : Record {

  private fun isDataUrl() = uri?.startsWith("data:")

  internal fun createGlideModel(): GlideModel? {
    if (uri == null) {
      return null
    }

    if (isDataUrl() == true) {
      return GlideDataUrlModel(uri)
    }

    return GlideUrlModel(GlideUrl(uri, getCustomHeaders()))
  }

  internal fun createOptions(context: Context): RequestOptions {
    return RequestOptions()
      .apply {
        // Override the size for local assets. This ensures that
        // resizeMode "center" displays the image in the correct size.
        if (width != 0 && height != 0) {
          override((width * scale).toInt(), (height * scale).toInt())
        }

        if (isResourceUri(context)) {
          // Every local resource (drawable) in Android has its own unique numeric id, which are
          // generated at build time. Although these ids are unique, they are not guaranteed unique
          // across builds. The underlying glide implementation caches these resources. To make
          // sure the cache does not return the wrong image, we should clear the cache when the
          // application version changes.
          apply(
            GlideOptions.signatureOf(ApplicationVersionSignature.obtain(context))
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

  private fun isResourceUri(context: Context): Boolean {
    return "android.resource" == computeUri(context)?.scheme
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
    return ResourceDrawableIdHelper.getInstance().getResourceDrawableUri(context, stringUri)
  }

  internal val pixelCount: Double
    get() = width * height * scale * scale
}
