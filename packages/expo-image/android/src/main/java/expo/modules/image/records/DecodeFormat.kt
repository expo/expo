package expo.modules.image.records

import expo.modules.kotlin.types.Enumerable

enum class DecodeFormat(val value: String) : Enumerable {
  ARGB_8888("argb"),
  RGB_565("rgb");

  fun toGlideFormat(): com.bumptech.glide.load.DecodeFormat {
    return when (this) {
      ARGB_8888 -> com.bumptech.glide.load.DecodeFormat.PREFER_ARGB_8888
      RGB_565 -> com.bumptech.glide.load.DecodeFormat.PREFER_RGB_565
    }
  }
}
