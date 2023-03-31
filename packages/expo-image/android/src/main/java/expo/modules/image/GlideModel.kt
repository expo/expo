package expo.modules.image

import android.net.Uri
import com.bumptech.glide.load.model.GlideUrl
import expo.modules.image.okhttp.GlideUrlWrapper

sealed class GlideModel {
  abstract val glideData: Any

  override fun equals(other: Any?): Boolean {
    if (this === other) {
      return true
    }
    return other is GlideModel && glideData == other.glideData
  }

  override fun hashCode(): Int = glideData.hashCode()
}

class GlideUrlModel(
  glideUrl: GlideUrl
) : GlideModel() {
  override val glideData: GlideUrlWrapper = GlideUrlWrapper(glideUrl)
}

class GlideRawModel(
  data: String
) : GlideModel() {
  override val glideData: String = data
}

class GlideUriModel(
  uri: Uri
) : GlideModel() {
  override val glideData: Uri = uri
}

class GlideBlurhashModel(
  val uri: Uri,
  val width: Int,
  val height: Int
) : GlideModel() {
  override val glideData: GlideBlurhashModel = this

  override fun equals(other: Any?): Boolean {
    if (this === other) {
      return true
    }

    return other is GlideBlurhashModel && uri == other.uri && width == other.width && height == other.height
  }

  override fun hashCode(): Int {
    var result = uri.hashCode()
    result = 31 * result + width
    result = 31 * result + height
    return result
  }
}
