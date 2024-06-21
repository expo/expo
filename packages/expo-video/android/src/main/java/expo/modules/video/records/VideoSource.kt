package expo.modules.video.records
import android.content.Context
import androidx.annotation.OptIn
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.source.MediaSource
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.video.UnsupportedDRMTypeException
import expo.modules.video.buildMediaSourceWithHeaders
import java.io.Serializable

@OptIn(UnstableApi::class)
class VideoSource(
  @Field var uri: String? = null,
  @Field var drm: DRMOptions? = null,
  @Field var metadata: VideoMetadata? = null,
  @Field var headers: Map<String, String>? = null
) : Record, Serializable {
  private fun toMediaId(): String {
    return "uri:${this.uri}" +
      "Headers: ${this.headers}" +
      "DrmType:${this.drm?.type}" +
      "DrmLicenseServer:${this.drm?.licenseServer}" +
      "DrmMultiKey:${this.drm?.multiKey}" +
      "DRMHeadersKeys:${this.drm?.headers?.keys?.joinToString { it }}}" +
      "DRMHeadersValues:${this.drm?.headers?.values?.joinToString { it }}}" +
      "NotificationDataTitle:${this.metadata?.title}" +
      "NotificationDataSecondaryText:${this.metadata?.artist}"
  }

  fun toMediaSource(context: Context): MediaSource {
    return buildMediaSourceWithHeaders(context, this)
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
