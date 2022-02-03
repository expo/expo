package expo.modules.filesystem

enum class UploadType(private val value: Int) {
  INVALID(-1),
  BINARY_CONTENT(0),
  MULTIPART(1);

  companion object {
    fun fromInt(value: Int): UploadType = values().find { value == it.value } ?: INVALID
  }
}
