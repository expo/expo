package expo.modules.image.records

import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.request.RequestOptions
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class SourceMap(
  @Field val uri: String? = null,
  @Field val width: Int? = null,
  @Field val height: Int? = null,
  @Field val scale: Double? = null,
) : Record {
  internal fun createGlideUrl(): GlideUrl? = uri?.let { GlideUrl(it) }

  internal fun createOptions(): RequestOptions {
    return RequestOptions()
      .apply {
        // Override the size for local assets. This ensures that
        // resizeMode "center" displays the image in the correct size.
        if (width != null && height != null && scale != null) {
          override((width * scale).toInt(), (height * scale).toInt())
        }
      }
  }
}
