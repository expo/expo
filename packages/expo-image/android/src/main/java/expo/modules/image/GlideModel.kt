package expo.modules.image

import android.net.Uri
import com.bumptech.glide.load.model.GlideUrl

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
  override val glideData: GlideUrl = glideUrl
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
