package abi47_0_0.expo.modules.documentpicker

import abi47_0_0.expo.modules.core.Promise

data class DocumentPickerOptions(val copyToCacheDirectory: Boolean, val types: Array<String>) {
  companion object {
    fun optionsFromMap(options: Map<String, Any?>, promise: Promise): DocumentPickerOptions? {
      if (options.containsKey("type") && options["type"] == null) {
        promise.reject("ERR_INVALID_OPTION", "type must be a list of strings")
        return null
      }
      var mimeTypes = arrayListOf("*/*")
      options["type"]?.let {
        val types = it as ArrayList<*>
        if (types.isEmpty() || types[0] !is String) {
          promise.reject("ERR_INVALID_OPTION", "type must be a list of strings")
          return null
        } else {
          @Suppress("UNCHECKED_CAST")
          mimeTypes = types as ArrayList<String>
        }
      }
      val copyToCacheDirectory = options["copyToCacheDirectory"]?.let {
        if (it is Boolean) {
          return@let it
        }
        promise.reject("ERR_INVALID_OPTION", "copyToCacheDirectory must be a boolean")
        return null
      } ?: true
      return DocumentPickerOptions(copyToCacheDirectory, mimeTypes.toTypedArray())
    }
  }

  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (javaClass != other?.javaClass) return false

    other as DocumentPickerOptions

    if (copyToCacheDirectory != other.copyToCacheDirectory) return false
    if (!types.contentEquals(other.types)) return false

    return true
  }

  override fun hashCode(): Int {
    var result = copyToCacheDirectory.hashCode()
    result = 31 * result + types.contentHashCode()
    return result
  }
}
