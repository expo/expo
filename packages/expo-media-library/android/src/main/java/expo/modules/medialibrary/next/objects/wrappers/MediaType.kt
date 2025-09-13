package expo.modules.medialibrary.next.objects.wrappers

import android.net.Uri
import android.provider.MediaStore
import expo.modules.kotlin.types.Enumerable

enum class MediaType(val value: String) : Enumerable {
  AUDIO("audio"),
  IMAGE("image"),
  VIDEO("video"),
  UNKNOWN("unknown");

  fun toMediaStoreValue(): Int {
    return when (this) {
      AUDIO -> MediaStore.Files.FileColumns.MEDIA_TYPE_AUDIO
      IMAGE -> MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE
      VIDEO -> MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO
      UNKNOWN -> MediaStore.Files.FileColumns.MEDIA_TYPE_NONE
    }
  }

  companion object {
    fun fromString(string: String): MediaType {
      return when (string.lowercase()) {
        "audio" -> AUDIO
        "image" -> IMAGE
        "video" -> VIDEO
        else -> UNKNOWN
      }
    }

    fun fromMediaStoreValue(mediaStoreValue: Int): MediaType {
      return when (mediaStoreValue) {
        MediaStore.Files.FileColumns.MEDIA_TYPE_AUDIO -> AUDIO
        MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE -> IMAGE
        MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO -> VIDEO
        else -> UNKNOWN
      }
    }

    fun fromContentUri(contentUri: Uri): MediaType {
      val pathSegments = contentUri.pathSegments
      if (pathSegments.contains("images")) {
        return IMAGE
      }
      if (pathSegments.contains("video")) {
        return VIDEO
      }
      if (pathSegments.contains("audio")) {
        return AUDIO
      }
      return UNKNOWN
    }
  }
}
