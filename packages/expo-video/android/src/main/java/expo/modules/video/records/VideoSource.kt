package expo.modules.video.records

import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.video.UnsupportedDRMTypeException
import java.io.Serializable

class VideoSource(
  @Field var uri: String? = null,
  @Field var drm: DRMOptions? = null,
  @Field var metadata: VideoMetadata? = null
) : Record, Serializable {
  private fun toMediaId(): String {
    return "uri:${this.uri}" +
      "DrmType:${this.drm?.type}" +
      "DrmLicenseServer:${this.drm?.licenseServer}" +
      "DrmMultiKey:${this.drm?.multiKey}" +
      "DRMHeadersKeys:${this.drm?.headers?.keys?.joinToString {it}}}" +
      "DRMHeadersValues:${this.drm?.headers?.values?.joinToString {it}}}" +
      "NotificationDataTitle:${this.metadata?.title}" +
      "NotificationDataSecondaryText:${this.metadata?.artist}"
  }

  fun toMediaItem() = MediaItem
    .Builder()
    .apply {
      setUri(uri ?: "")
      setMediaId(toMediaId())
      drm?.let {
        if (it.type.isSupported()) {
          setDrmConfiguration(it.toDRMConfiguration())
        } else {
          throw UnsupportedDRMTypeException(it.type)
        }
      }
      setMediaMetadata(
        MediaMetadata.Builder().apply {
          metadata?.let { data ->
            setTitle(data.title)
            setArtist(data.artist)
          }
        }.build()
      )
    }
    .build()
}
