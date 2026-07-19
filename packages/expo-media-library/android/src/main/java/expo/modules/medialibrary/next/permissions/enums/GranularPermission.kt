package expo.modules.medialibrary.next.permissions.enums

import android.Manifest.permission.READ_MEDIA_AUDIO
import android.Manifest.permission.READ_MEDIA_IMAGES
import android.Manifest.permission.READ_MEDIA_VIDEO
import expo.modules.kotlin.types.Enumerable

enum class GranularPermission(val value: String) : Enumerable {
  AUDIO("audio"),
  PHOTO("photo"),
  VIDEO("video");

  fun toManifestPermission(): String = when (this) {
    AUDIO -> READ_MEDIA_AUDIO
    PHOTO -> READ_MEDIA_IMAGES
    VIDEO -> READ_MEDIA_VIDEO
  }
}
