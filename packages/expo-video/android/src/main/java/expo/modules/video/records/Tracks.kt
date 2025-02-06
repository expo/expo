package expo.modules.video.records

import androidx.annotation.OptIn
import androidx.media3.common.Format
import androidx.media3.common.util.UnstableApi
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable
import java.util.Locale

class SubtitleTrack(
  @Field val id: String,
  @Field val language: String?,
  @Field val label: String?
) : Record, Serializable {
  companion object {
    fun fromFormat(format: Format?): SubtitleTrack? {
      format ?: return null
      val id = format.id ?: return null
      val language = format.language ?: return null
      val label = Locale(language).displayLanguage

      return SubtitleTrack(
        id = id,
        language = language,
        label = label
      )
    }
  }
}

@OptIn(UnstableApi::class)
class VideoTrack(
  @Field val id: String,
  @Field val size: VideoSize,
  @Field val mimeType: String?,
  @Field val isSupported: Boolean = true,
  @Field val bitrate: Int? = null,
  @Field val frameRate: Float? = null,
  var format: Format? = null
) : Record, Serializable {
  companion object {
    fun fromFormat(format: Format?, isSupported: Boolean): VideoTrack? {
      if (format == null) {
        return null
      }
      val id = format.id ?: return null
      val size = VideoSize(format)
      val mimeType = format.sampleMimeType
      val bitrate = format.bitrate.takeIf { it != Format.NO_VALUE }
      val frameRate = format.frameRate.takeIf { it != Format.NO_VALUE.toFloat() }
      return VideoTrack(
        id = id,
        size = size,
        mimeType = mimeType,
        isSupported = isSupported,
        bitrate = bitrate,
        frameRate = frameRate,
        format = format
      )
    }
  }
}
