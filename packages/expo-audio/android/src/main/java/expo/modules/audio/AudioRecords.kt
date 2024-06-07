package expo.modules.audio

import android.media.MediaRecorder
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

class AudioSource(
  @Field val uri: String? = null,
  @Field val headers: Map<String, String>?
) : Record

class AudioMode(
  @Field val playsInSilentMode: Boolean = false,
  @Field val interruptionMode: InterruptionMode = InterruptionMode.MIX_WITH_OTHERS,
  @Field val allowsRecording: Boolean = true,
  @Field val shouldPlayInBackground: Boolean = true
) : Record

enum class InterruptionMode(val value: String) : Enumerable {
  MIX_WITH_OTHERS("mixWithOthers"),
  DO_NOT_MIX("doNotMix"),
  DUCK_OTHERS("duckOthers")
}

class RecordingOptions(
  @Field val audioEncoder: AndroidAudioEncoder? = AndroidAudioEncoder.DEFAULT,
  @Field val bitRate: Double?,
  @Field val extension: String,
  @Field val maxFileSize: Int?,
  @Field val numberOfChannels: Double?,
  @Field val isMeteringEnabled: Boolean?,
  @Field val outputFormat: String?,
  @Field val sampleRate: Double?
) : Record

enum class AndroidAudioEncoder(val value: String) : Enumerable {
  DEFAULT("DEFAULT"),
  AMR_NB("AMR_NB"),
  AMR_WB("AMR_WB"),
  AAC("AAC"),
  HE_AAC("HE_AAC"),
  AAC_ELD("AAC_ELD");

  fun toMediaEncoding() = when (this) {
    DEFAULT -> MediaRecorder.AudioEncoder.DEFAULT
    AMR_NB -> MediaRecorder.AudioEncoder.AMR_NB
    AMR_WB -> MediaRecorder.AudioEncoder.AMR_WB
    AAC -> MediaRecorder.AudioEncoder.AAC
    HE_AAC -> MediaRecorder.AudioEncoder.HE_AAC
    AAC_ELD -> MediaRecorder.AudioEncoder.AAC_ELD
  }
}

enum class AndroidOutputFormat(val value: String) : Enumerable {
  DEFAULT("DEFAULT"),
  THREE_GPP("THREE_GPP"),
  MPEG_4("MPEG_4"),
  AMR_NB("AMR_NB"),
  AMR_WB("AMR_WB"),
  AAC_ADTS("AAC_ADTS"),
  WEBM("WEBM");

  fun toMediaOutputFormat() = when (this) {
    DEFAULT -> MediaRecorder.OutputFormat.DEFAULT
    THREE_GPP -> MediaRecorder.OutputFormat.THREE_GPP
    MPEG_4 -> MediaRecorder.OutputFormat.MPEG_4
    AMR_NB -> MediaRecorder.OutputFormat.AMR_NB
    AMR_WB -> MediaRecorder.OutputFormat.AMR_WB
    AAC_ADTS -> MediaRecorder.OutputFormat.AAC_ADTS
    WEBM -> MediaRecorder.OutputFormat.WEBM
  }
}