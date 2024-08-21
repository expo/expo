package expo.modules.image

import android.graphics.drawable.Drawable
import android.net.Uri
import com.bumptech.glide.load.model.GlideUrl
import expo.modules.image.decodedsource.DecodedModel
import expo.modules.image.okhttp.GlideUrlWrapper

sealed class GlideModelProvider {
  abstract val glideModel: Any

  override fun equals(other: Any?): Boolean {
    if (this === other) {
      return true
    }
    return other is GlideModelProvider && glideModel == other.glideModel
  }

  override fun hashCode(): Int = glideModel.hashCode()
}

class DecodedModelProvider(drawable: Drawable) : GlideModelProvider() {
  override val glideModel = DecodedModel(drawable)
}

class UrlModelProvider(
  glideUrl: GlideUrl
) : GlideModelProvider() {
  override val glideModel: GlideUrlWrapper = GlideUrlWrapper(glideUrl)
}

class RawModelProvider(
  data: String
) : GlideModelProvider() {
  override val glideModel: String = data
}

class UriModelProvider(
  uri: Uri
) : GlideModelProvider() {
  override val glideModel: Uri = uri
}

class BlurhashModelProvider(
  val uri: Uri,
  val width: Int,
  val height: Int
) : GlideModelProvider() {
  override val glideModel: BlurhashModelProvider = this

  override fun equals(other: Any?): Boolean {
    if (this === other) {
      return true
    }

    return other is BlurhashModelProvider && uri == other.uri && width == other.width && height == other.height
  }

  override fun hashCode(): Int {
    var result = uri.hashCode()
    result = 31 * result + width
    result = 31 * result + height
    return result
  }
}

class ThumbhashModelProvider(
  var uri: Uri
) : GlideModelProvider() {
  override val glideModel: ThumbhashModelProvider = this

  override fun equals(other: Any?): Boolean {
    return (this === other) || other is ThumbhashModelProvider && uri == other.uri
  }

  override fun hashCode(): Int {
    return uri.hashCode()
  }
}
