package abi44_0_0.expo.modules.imagepicker

enum class MediaTypes {
  IMAGES, VIDEOS, ALL;

  companion object {
    fun fromString(type: String): MediaTypes? {
      return when (type) {
        "Images" -> IMAGES
        "Videos" -> VIDEOS
        "All" -> ALL
        else -> null
      }
    }
  }
}
