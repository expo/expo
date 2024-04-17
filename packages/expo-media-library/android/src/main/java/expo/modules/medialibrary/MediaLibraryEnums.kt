package expo.modules.medialibrary

import android.Manifest
import android.os.Build
import android.provider.MediaStore
import androidx.annotation.RequiresApi
import expo.modules.kotlin.types.Enumerable

enum class GranularPermission(val value: String) : Enumerable {
  AUDIO("audio"),
  PHOTO("photo"),
  VIDEO("video");

  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  fun toManifestPermission(): String {
    return when (this) {
      AUDIO -> Manifest.permission.READ_MEDIA_AUDIO
      PHOTO -> Manifest.permission.READ_MEDIA_IMAGES
      VIDEO -> Manifest.permission.READ_MEDIA_VIDEO
    }
  }
}

enum class AccessPrivileges(val value: String) {
  ALL("all"),
  LIMITED("limited"),
  NONE("none")
}

enum class MediaType(val apiName: String, val mediaColumn: Int?) {
  AUDIO("audio", MediaStore.Files.FileColumns.MEDIA_TYPE_AUDIO),
  PHOTO("photo", MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE),
  VIDEO("video", MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO),
  UNKNOWN("unknown", MediaStore.Files.FileColumns.MEDIA_TYPE_NONE),
  ALL("all", null);

  companion object {
    // all constants have keys equal to the values
    fun getConstants() = values().associate { Pair(it.apiName, it.apiName) }

    fun fromApiName(constantName: String) = values().find { it.apiName == constantName }
  }
}

enum class SortBy(val keyName: String, val mediaColumnName: String) {
  DEFAULT("default", MediaStore.Images.Media._ID),
  CREATION_TIME("creationTime", MediaStore.Images.Media.DATE_TAKEN),
  MODIFICATION_TIME("modificationTime", MediaStore.Images.Media.DATE_MODIFIED),
  MEDIA_TYPE("mediaType", MediaStore.Files.FileColumns.MEDIA_TYPE),
  WIDTH("width", MediaStore.MediaColumns.WIDTH),
  HEIGHT("height", MediaStore.MediaColumns.HEIGHT),
  DURATION("duration", MediaStore.Video.VideoColumns.DURATION);

  companion object {
    // all constants have keys equal to the values
    fun getConstants() = values().associate { Pair(it.keyName, it.keyName) }

    fun fromKeyName(keyName: String) = values().find { it.keyName == keyName }
  }
}
