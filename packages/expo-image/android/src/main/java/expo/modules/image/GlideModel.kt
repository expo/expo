package expo.modules.image

import com.bumptech.glide.load.model.GlideUrl

sealed class GlideModel {
  abstract val glideData: Any

  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (other !is GlideModel) return false
    if (glideData != other.glideData) return false
    return true
  }

  override fun hashCode(): Int = glideData.hashCode()
}

data class GlideUrlModel(
  private val glideUrl: GlideUrl
) : GlideModel() {
  override val glideData: GlideUrl = glideUrl
}

data class GlideDataUrlModel(
  private val uri: String
) : GlideModel() {
  override val glideData: String = uri
}
