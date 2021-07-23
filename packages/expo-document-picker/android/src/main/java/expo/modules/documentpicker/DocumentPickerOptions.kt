package expo.modules.documentpicker

import org.unimodules.core.Promise

data class DocumentPickerOptions(val type: String, val copyToCacheDirectory: Boolean, val types: Array<String>?) {
  companion object {
    fun optionsFromMap(options: Map<String, Any?>, promise: Promise): DocumentPickerOptions? {
      var type = "*/*"
      var types: ArrayList<String>? = null
      options["type"]?.let {
        if (it is String) {
          type = it
        } else if (it is ArrayList<*> && it.isNotEmpty() && it[0] is String) {
          @Suppress("UNCHECKED_CAST")
          types = it as ArrayList<String>
        } else {
          promise.reject("ERR_INVALID_OPTION", "type must be a string or list of strings")
          return null
        }
      }
      val copyToCacheDirectory = options["copyToCacheDirectory"]?.let {
        if (it is Boolean) {
          return@let it
        }
        promise.reject("ERR_INVALID_OPTION", "copyToCacheDirectory must be a boolean")
        return null
      } ?: true
      return DocumentPickerOptions(type, copyToCacheDirectory, types?.toTypedArray())
    }
  }
}
