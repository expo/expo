package expo.modules.imagepicker

enum class MediaTypes {
  IMAGE, VIDEO, ALL;

  companion object {
    fun fromString(type: String): MediaTypes? {
      return when (type) {
        "Image" -> IMAGE
        "Video" -> VIDEO
        "All" -> ALL
        else -> null
      }
    }
  }
}

