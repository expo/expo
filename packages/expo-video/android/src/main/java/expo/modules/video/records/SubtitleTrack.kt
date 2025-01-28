package expo.modules.video.records

import androidx.media3.common.Format
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable
import java.util.Locale

class SubtitleTrack(
  @Field var id: String,
  @Field var language: String?,
  @Field var label: String?
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
