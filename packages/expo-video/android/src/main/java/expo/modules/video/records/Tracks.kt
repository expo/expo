package expo.modules.video.records

import android.net.Uri
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
  @Field val label: String?,
  @Field val name: String?,
  @Field val isDefault: Boolean,
  @Field val autoSelect: Boolean
) : Record, Serializable {
  companion object {
    fun fromFormat(format: Format?): SubtitleTrack? {
      format ?: return null
      val id = format.id ?: return null
      val language = format.language ?: return null
      val label = Locale(language).displayLanguage
      val name = format.label
      val isDefault = (format.selectionFlags and androidx.media3.common.C.SELECTION_FLAG_DEFAULT) != 0
      val autoSelect = (format.selectionFlags and androidx.media3.common.C.SELECTION_FLAG_AUTOSELECT) != 0

      return SubtitleTrack(
        id = id,
        language = language,
        label = label,
        name = name,
        isDefault = isDefault,
        autoSelect = autoSelect
      )
    }
  }
}

class AudioTrack(
  @Field val id: String,
  @Field val language: String?,
  @Field val label: String?,
  @Field val name: String?,
  @Field val isDefault: Boolean,
  @Field val autoSelect: Boolean
) : Record, Serializable {
  companion object {
    fun fromFormat(format: Format?): AudioTrack? {
      format ?: return null
      val id = format.id ?: return null
      val language = format.language
      val label = language?.let { Locale(it).displayLanguage } ?: "Unknown"
      val name = format.label
      val isDefault = (format.selectionFlags and androidx.media3.common.C.SELECTION_FLAG_DEFAULT) != 0
      val autoSelect = (format.selectionFlags and androidx.media3.common.C.SELECTION_FLAG_AUTOSELECT) != 0

      return AudioTrack(
        id = id,
        language = language,
        label = label,
        name = name,
        isDefault = isDefault,
        autoSelect = autoSelect
      )
    }
  }
}

@OptIn(UnstableApi::class)
class VideoTrack(
  @Field val id: String,
  @Field val url: Uri?,
  @Field val size: VideoSize,
  @Field val mimeType: String?,
  @Field val isSupported: Boolean = true,
  @Field val bitrate: Int? = null, // deprecated as of SDK 55
  @Field val averageBitrate: Int? = null,
  @Field val peakBitrate: Int? = null,
  @Field val frameRate: Float? = null,
  var format: Format? = null
) : Record, Serializable {
  companion object {
    fun fromFormat(format: Format?, isSupported: Boolean, variantUrl: Uri?): VideoTrack? {
      val id = format?.id ?: return null
      val size = VideoSize(format)
      val mimeType = format.sampleMimeType
      val averageBitrate = format.averageBitrate.takeIf { it != Format.NO_VALUE }
      val peakBitrate = format.peakBitrate.takeIf { it != Format.NO_VALUE }
      val frameRate = format.frameRate.takeIf { it != Format.NO_VALUE.toFloat() }

      return VideoTrack(
        id = id,
        url = variantUrl,
        size = size,
        mimeType = mimeType,
        isSupported = isSupported,
        bitrate = averageBitrate ?: peakBitrate,
        averageBitrate = averageBitrate,
        peakBitrate = peakBitrate,
        frameRate = frameRate,
        format = format
      )
    }
  }
}
