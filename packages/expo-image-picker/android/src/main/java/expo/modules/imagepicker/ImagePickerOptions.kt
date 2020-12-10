package expo.modules.imagepicker

import org.unimodules.core.Promise

data class ImagePickerOptions(val quality: Int,
                              val isAllowsEditing: Boolean,
                              val forceAspect: List<*>?,
                              val isBase64: Boolean,
                              val mediaTypes: MediaTypes,
                              val isExif: Boolean,
                              val videoMaxDuration: Int) {
  companion object {
    fun optionsFromMap(options: Map<String, Any?>, promise: Promise): ImagePickerOptions? {
      val quality = options[ImagePickerConstants.OPTION_QUALITY]?.let {
        if (it is Number) {
          return@let (it.toDouble() * 100).toInt()
        }

        promise.reject(ImagePickerConstants.ERR_INVALID_OPTION, "Quality can not be `null`.")
        return null
      } ?: ImagePickerConstants.DEFAULT_QUALITY

      val isAllowsEditing = options[ImagePickerConstants.OPTION_ALLOWS_EDITING] as? Boolean ?: false

      val forceAspect: List<*>? = options[ImagePickerConstants.OPTION_ASPECT]?.let {
        if (it is List<*> && it.size == 2 && it[0] is Number && it[1] is Number) {
          return@let it
        }

        promise.reject(ImagePickerConstants.ERR_INVALID_OPTION, "'Aspect option must be of form [Number, Number]")
        return null
      }

      val isBase64 = options[ImagePickerConstants.OPTION_BASE64] as? Boolean ?: false
      val mediaTypes = MediaTypes.fromString(
        options[ImagePickerConstants.OPTION_MEDIA_TYPES] as? String ?: "Images"
      ).ifNull {
        promise.reject(ImagePickerConstants.ERR_INVALID_OPTION, "Unknown media types: ${options[ImagePickerConstants.OPTION_MEDIA_TYPES]}")
        return null
      }
      val isExif = options[ImagePickerConstants.OPTION_EXIF] as? Boolean ?: false

      val videoMaxDuration = options[ImagePickerConstants.OPTION_VIDEO_MAX_DURATION]?.let {
        if (it is Number && it.toInt() >= 0) {
          return@let it.toInt()
        }

        promise.reject(ImagePickerConstants.ERR_INVALID_OPTION, "videoMaxDuration must be a non-negative integer")
        return null
      } ?: 0

      return ImagePickerOptions(quality, isAllowsEditing, forceAspect, isBase64, mediaTypes, isExif, videoMaxDuration)
    }
  }
}

