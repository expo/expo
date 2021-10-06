package expo.modules.filesystem

enum class UploadType(private val value: Int) {
  INVALID(-1), BINARY_CONTENT(0), MULTIPART(1);

  companion object {
    fun fromInt(value: Int): UploadType {
      for (method in values()) {
        if (value == method.value) {
          return method
        }
      }
      return INVALID
    }
  }
}
