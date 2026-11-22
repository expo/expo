package expo.modules.audio

import android.media.AudioManager
import android.media.MediaRecorder
import android.os.Build
import io.github.expo.modules.v2.Enumerable
import io.github.expo.modules.v2.Record
import java.net.URL

@Record
class AudioSource(
  val uri: String? = null,
  val headers: Map<String, String>? = null,
  val name: String? = null
)

enum class LoopMode(val value: String) : Enumerable {
  NONE("none"),
  SINGLE("single"),
  ALL("all")
}

@Record
class AudioMode(
  val shouldPlayInBackground: Boolean? = null,
  val shouldRouteThroughEarpiece: Boolean? = null,
  val interruptionMode: InterruptionMode? = null,
  val allowsBackgroundRecording: Boolean? = null,
  val playsInSilentMode: Boolean? = null
)

@Record
data class RecordingOptions(
  val extension: String,
  val sampleRate: Double? = null,
  val numberOfChannels: Double? = null,
  val bitRate: Double? = null,
  val outputFormat: AndroidOutputFormat? = null,
  val audioEncoder: AndroidAudioEncoder? = null,
  val maxFileSize: Int? = null,
  val isMeteringEnabled: Boolean = false,
  val audioSource: RecordingSource? = null,
  val directory: RecordingDirectory? = null,
  val fileName: String? = null
)

enum class RecordingDirectory(val value: String) : Enumerable {
  CACHE("cache"),
  DOCUMENT("document")
}

@Record
class Metadata(
  val title: String? = null,
  val artist: String? = null,
  val albumTitle: String? = null,
  val artworkUrl: URL? = null
)

enum class AndroidOutputFormat(val value: String) : Enumerable {
  DEFAULT("default"),
  THREE_GP("3gp"),
  MPEG_4("mpeg4"),
  AMR_NB("amrnb"),
  AMR_WB("amrwb"),
  AAC_ADTS("aac_adts"),
  MPEG2TS("mpeg2ts"),
  WEBM("webm");

  fun toMediaOutputFormat(): Int {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      if (this == MPEG2TS) {
        return MediaRecorder.OutputFormat.MPEG_2_TS
      }
    }

    return when (this) {
      DEFAULT -> MediaRecorder.OutputFormat.DEFAULT
      THREE_GP -> MediaRecorder.OutputFormat.THREE_GPP
      MPEG_4 -> MediaRecorder.OutputFormat.MPEG_4
      AMR_NB -> MediaRecorder.OutputFormat.AMR_NB
      AMR_WB -> MediaRecorder.OutputFormat.AMR_WB
      AAC_ADTS -> MediaRecorder.OutputFormat.AAC_ADTS
      WEBM -> MediaRecorder.OutputFormat.WEBM
      else -> MediaRecorder.OutputFormat.DEFAULT
    }
  }
}

enum class AndroidAudioEncoder(val value: String) : Enumerable {
  DEFAULT("default"),
  AMR_NB("amr_nb"),
  AMR_WB("amr_wb"),
  AAC("aac"),
  HE_AAC("he_aac"),
  AAC_ELD("aac_eld");

  fun toMediaEncoding() = when (this) {
    DEFAULT -> MediaRecorder.AudioEncoder.DEFAULT
    AMR_NB -> MediaRecorder.AudioEncoder.AMR_NB
    AMR_WB -> MediaRecorder.AudioEncoder.AMR_WB
    AAC -> MediaRecorder.AudioEncoder.AAC
    HE_AAC -> MediaRecorder.AudioEncoder.HE_AAC
    AAC_ELD -> MediaRecorder.AudioEncoder.AAC_ELD
  }
}

@Record
class AudioLockScreenOptions(
  val showSeekForward: Boolean,
  val showSeekBackward: Boolean,
  val showNextTrack: Boolean = false,
  val showPreviousTrack: Boolean = false,
  val isLiveStream: Boolean? = null,
  val seekForwardIntervalSeconds: Double = 10.0,
  val seekBackwardIntervalSeconds: Double = 10.0
)

enum class InterruptionMode(val value: String) : Enumerable {
  DO_NOT_MIX("doNotMix"),
  DO_NOT_MIX_PERSISTENT("doNotMixPersistent"),
  DUCK_OTHERS("duckOthers"),
  MIX_WITH_OTHERS("mixWithOthers");

  fun toAudioFocusGain(): Int? = when (this) {
    DO_NOT_MIX_PERSISTENT -> AudioManager.AUDIOFOCUS_GAIN
    DO_NOT_MIX -> AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
    DUCK_OTHERS -> AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
    MIX_WITH_OTHERS -> null
  }
}

@Record
class RecordOptions(
  val atTime: Double? = null,
  val forDuration: Double? = null
)

enum class AudioStreamEncoding(val value: String) : Enumerable {
  FLOAT32("float32"),
  INT16("int16")
}

@Record
class AudioStreamOptions(
  val sampleRate: Int = 48000,
  val channels: Int = 1,
  val encoding: AudioStreamEncoding = AudioStreamEncoding.FLOAT32
)

enum class RecordingSource(val value: String) : Enumerable {
  CAMCORDER("camcorder"),
  DEFAULT("default"),
  MIC("mic"),
  REMOTE_SUBMIX("remote_submix"),
  UNPROCESSED("unprocessed"),
  VOICE_COMMUNICATION("voice_communication"),
  VOICE_PERFORMANCE("voice_performance"),
  VOICE_RECOGNITION("voice_recognition");

  fun toAudioSource() = when (this) {
    CAMCORDER -> MediaRecorder.AudioSource.CAMCORDER
    DEFAULT -> MediaRecorder.AudioSource.DEFAULT
    MIC -> MediaRecorder.AudioSource.MIC
    REMOTE_SUBMIX -> MediaRecorder.AudioSource.REMOTE_SUBMIX
    UNPROCESSED -> MediaRecorder.AudioSource.UNPROCESSED
    VOICE_COMMUNICATION -> MediaRecorder.AudioSource.VOICE_COMMUNICATION
    VOICE_PERFORMANCE -> MediaRecorder.AudioSource.VOICE_PERFORMANCE
    VOICE_RECOGNITION -> MediaRecorder.AudioSource.VOICE_RECOGNITION
  }
}

enum class AudioStreamFileFormat(val value: String) : Enumerable {
  WAV("wav"),
  PCM("pcm");

  val fileExtension: String get() = value
}

@Record
class AudioStreamFileRecordingOptions(
  val uri: URL? = null,
  val directory: RecordingDirectory? = null,
  val format: AudioStreamFileFormat = AudioStreamFileFormat.WAV
)

@Record
class AudioStreamFileRecordingStartResult(
  val uri: URL? = null
)

@Record
class AudioStreamFileRecordingResult(
  val uri: URL? = null,
  val duration: Double = 0.0,
  val size: Long = 0L,
  val sampleRate: Int = 0,
  val channels: Int = 0,
  val encoding: AudioStreamEncoding = AudioStreamEncoding.FLOAT32
)
