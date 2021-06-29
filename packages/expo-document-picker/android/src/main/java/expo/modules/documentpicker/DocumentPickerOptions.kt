package expo.modules.documentpicker

import org.unimodules.core.Promise

data class DocumentPickerOptions(val type: String, val copyToCacheDirectory: Boolean) {
  companion object {
    fun optionsFromMap(options: Map<String, Any?>, promise: Promise): DocumentPickerOptions? {
      val type = options["type"]?.let {
        if (it is String) {
          return@let it
        }

        promise.reject("ERR_INVALID_OPTION", "type must be a string")
        return null
      } ?: "*/*"

      val copyToCacheDirectory = options["copyToCacheDirectory"]?.let {
        if (it is Boolean) {
          return@let it
        }
        promise.reject("ERR_INVALID_OPTION", "copyToCacheDirectory must be a boolean")
        return null
      } ?: true

      return DocumentPickerOptions(type, copyToCacheDirectory)
    }
  }
}
