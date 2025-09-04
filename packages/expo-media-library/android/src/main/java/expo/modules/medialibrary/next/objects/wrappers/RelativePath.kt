package expo.modules.medialibrary.next.objects.wrappers

import android.os.Environment

@JvmInline
value class RelativePath(val value: String) {
  init {
    require(
      value.matches(Regex("""^[\w-]+(/[\w-]+)*/$"""))
    ) { "Invalid relative path: $value" }
  }

  // Warning
  // In the MediaStore.MediaColumns.RELATIVE_PATH documentation it is stated that
  // you should not attempt to construct a raw filesystem path using data from the database.
  // However a RelativePath for a legacy Asset is constructed from a raw filesystem path, therefore
  // constructing a raw filesystem path from a RelativePath for a legacy Asset is safe.
  fun toFilePath(): String {
    return "${Environment.getExternalStorageDirectory().absolutePath}/$value/"
  }

  companion object {
    fun create(mimeType: MimeType, albumName: String? = null): RelativePath {
      val rootDirectory = mimeType.rootDirectory()
      if (albumName != null) {
        return RelativePath("$rootDirectory/$albumName/")
      }
      return RelativePath("$rootDirectory/")
    }
  }
}
