package expo.modules.documentpicker

import org.unimodules.core.Promise

data class DocumentPickerOptions(val type: String, val copyToCacheDirectory: Boolean, val types: Array<String>?) {
  companion object {
    fun optionsFromMap(options: Map<String, Any?>, promise: Promise): DocumentPickerOptions? {
      var mimeType = "*/*"
      var extraMimeTypes: ArrayList<String>? = null
      options["type"]?.let {
        val types = it as ArrayList<*>
        if (types.isEmpty() || types[0] !is String) {
          promise.reject("ERR_INVALID_OPTION", "type must be a list of strings")
          return null
        } else if (types.size == 1) {
          mimeType = types[0] as String
        } else if (types[0] is String) {
          @Suppress("UNCHECKED_CAST")
          extraMimeTypes = it as ArrayList<String>
        }
      }
      val copyToCacheDirectory = options["copyToCacheDirectory"]?.let {
        if (it is Boolean) {
          return@let it
        }
        promise.reject("ERR_INVALID_OPTION", "copyToCacheDirectory must be a boolean")
        return null
      } ?: true
      return DocumentPickerOptions(mimeType, copyToCacheDirectory, extraMimeTypes?.toTypedArray())
    }
  }

  override fun equals(other: Any?): Boolean {
    if (this === other) return true
    if (javaClass != other?.javaClass) return false

    other as DocumentPickerOptions

    if (type != other.type) return false
    if (copyToCacheDirectory != other.copyToCacheDirectory) return false
    if (types != null) {
      if (other.types == null) return false
      if (!types.contentEquals(other.types)) return false
    } else if (other.types != null) return false

    return true
  }

  override fun hashCode(): Int {
    var result = type.hashCode()
    result = 31 * result + copyToCacheDirectory.hashCode()
    result = 31 * result + (types?.contentHashCode() ?: 0)
    return result
  }
}
