package expo.modules.video

import androidx.media3.common.C
import androidx.media3.common.MediaItem
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import java.io.Serializable
import java.util.UUID

internal class VideoSource(
  @Field var uri: String? = null,
  @Field var drm: DRMArguments? = null
) : Record, Serializable {
  fun toMediaItem(): MediaItem {
    val mediaItem = MediaItem
      .Builder()
      .setUri(this.uri ?: "")

    this.drm?.let {
      if (it.type.isSupported()) {
        mediaItem.setDrmConfiguration(it.toDRMConfiguration())
      } else {
        throw UnsupportedDRMTypeException(it.type)
      }
    }
    return mediaItem.build()
  }
}

internal enum class DRMType(val value: String) : Enumerable {
  CLEARKEY("clearkey"),
  FAIRPLAY("fairplay"),
  PLAYREADY("playready"),
  WIDEVINE("widevine");

  fun isSupported(): Boolean {
    return this != FAIRPLAY
  }

  fun toUUID(): UUID {
    return when (this) {
      CLEARKEY -> C.CLEARKEY_UUID
      FAIRPLAY -> throw UnsupportedDRMTypeException(this)
      PLAYREADY -> C.PLAYREADY_UUID
      WIDEVINE -> C.WIDEVINE_UUID
    }
  }
}

internal class DRMArguments(
  @Field var type: DRMType = DRMType.WIDEVINE,
  @Field var licenseServer: String? = null,
  @Field var headers: Map<String, String>? = null,
  @Field var multiKey: Boolean = false
) : Record, Serializable {

  fun toDRMConfiguration(): MediaItem.DrmConfiguration {
    val drmConfiguration = MediaItem.DrmConfiguration.Builder(type.toUUID())
    licenseServer?.let { drmConfiguration.setLicenseUri(it) }
    headers?.let { drmConfiguration.setLicenseRequestHeaders(it) }
    drmConfiguration.setMultiSession(multiKey)
    return drmConfiguration.build()
  }
}
