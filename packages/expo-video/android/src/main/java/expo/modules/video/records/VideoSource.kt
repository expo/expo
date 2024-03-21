package expo.modules.video.records

import androidx.media3.common.MediaItem
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.video.UnsupportedDRMTypeException
import java.io.Serializable

internal class VideoSource(
  @Field var uri: String? = null,
  @Field var drm: DRMOptions? = null
) : Record, Serializable {
  fun toMediaItem() = MediaItem
    .Builder()
    .apply {
      setUri(uri ?: "")
      drm?.let {
        if (it.type.isSupported()) {
          setDrmConfiguration(it.toDRMConfiguration())
        } else {
          throw UnsupportedDRMTypeException(it.type)
        }
      }
    }
    .build()
}
