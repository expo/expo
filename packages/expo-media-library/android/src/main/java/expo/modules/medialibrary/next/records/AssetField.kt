package expo.modules.medialibrary.next.records

import android.provider.MediaStore
import expo.modules.kotlin.types.Enumerable

enum class AssetField(val key: String) : Enumerable {
  CREATION_TIME("creationTime"),
  MODIFICATION_TIME("modificationTime"),
  MEDIA_TYPE("mediaType"),
  WIDTH("width"),
  HEIGHT("height"),
  DURATION("duration");

  fun toMediaStoreColumn(): String =
    when (this) {
      CREATION_TIME -> MediaStore.Images.Media.DATE_TAKEN
      MODIFICATION_TIME -> MediaStore.Images.Media.DATE_MODIFIED
      MEDIA_TYPE -> MediaStore.Files.FileColumns.MEDIA_TYPE
      WIDTH -> MediaStore.MediaColumns.WIDTH
      HEIGHT -> MediaStore.MediaColumns.HEIGHT
      DURATION -> MediaStore.Video.VideoColumns.DURATION
    }
}
