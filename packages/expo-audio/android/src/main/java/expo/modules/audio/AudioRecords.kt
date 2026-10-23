package expo.modules.audio

import android.graphics.Color
import android.media.AudioManager
import android.media.MediaRecorder
import android.os.Build
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import java.net.URL
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
class AudioSource(
  @Field val uri: String?,
  @Field val headers: Map<String, String>?,
  @Field val name: String? = null
) : Record

enum class LoopMode(val value: String) : Enumerable {
  NONE("none"),
  SINGLE("single"),
  ALL("all")
}

@OptimizedRecord
class AudioMode(
  @Field val shouldPlayInBackground: Boolean = false,
  @Field val shouldRouteThroughEarpiece: Boolean?,
  @Field val interruptionMode: InterruptionMode?,
  @Field val allowsBackgroundRecording: Boolean = false,
  @Field val playsInSilentMode: Boolean = true
) : Record

// Data class because we want `equals`
@OptimizedRecord
data class RecordingOptions(
  @Field val extension: String,
  @Field val sampleRate: Double?,
  @Field val numberOfChannels: Double?,
  @Field val bitRate: Double?,
  @Field val outputFormat: AndroidOutputFormat?,
  @Field val audioEncoder: AndroidAudioEncoder?,
  @Field val maxFileSize: Int?,
  @Field val isMeteringEnabled: Boolean = false,
  @Field val audioSource: RecordingSource?,
  @Field val directory: RecordingDirectory?,
  @Field val fileName: String? = null
) : Record

enum class RecordingDirectory(val value: String) : Enumerable {
  CACHE("cache"),
  DOCUMENT("document")
}

@OptimizedRecord
data class RecordingNotificationButton(
  @Field val id: String,
  @Field val title: String? = null,
  @Field val preventDefault: Boolean = false
) : Record

@OptimizedRecord
class RecordingNotificationOptions(
  @Field val title: String = "Recording audio",
  @Field val recordingBody: String = "Tap to return to app",
  @Field val pausedBody: String? = null,
  @Field val pauseButtonTitle: String = "Pause",
  @Field val resumeButtonTitle: String = "Resume",
  @Field val stopButtonTitle: String = "Stop",
  @Field val channelName: String = "Audio Recording",
  @Field val channelDescription: String = "Shows when audio is being recorded in the background",
  @Field val smallIcon: String? = null,
  @Field val color: Color? = null,
  @Field val showPauseResume: Boolean = false,
  @Field val showOnLockScreen: Boolean = false,
  @Field val buttons: List<RecordingNotificationButton>? = null
) : Record {
  fun validate() {
    val buttons = buttons ?: return
    if (buttons.size > 3) {
      throw InvalidRecordingNotificationButtonsException("Android supports at most three notification buttons. Remove a button.")
    }
    if (buttons.none { it.id == "stop" }) {
      throw InvalidRecordingNotificationButtonsException("The recording notification needs a Stop button. Include a button with ID 'stop'.")
    }
    if (buttons.any { it.id.isBlank() || it.title?.isBlank() == true || (it.id !in listOf("pause", "resume", "stop") && it.title == null) }) {
      throw InvalidRecordingNotificationButtonsException("Each button needs a non-empty ID. Give each custom button a non-empty title.")
    }
    val ids = buttons.map {
      if (it.id == "resume") {
        "pause"
      } else {
        it.id
      }
    }
    if (ids.distinct().size != ids.size) {
      throw InvalidRecordingNotificationButtonsException("Button IDs must be unique. Pause and Resume share one button, so include only one of them.")
    }
  }

  internal fun resolvedButtons(paused: Boolean): List<RecordingNotificationButton> {
    val configured = buttons ?: buildList {
      if (showPauseResume) {
        add(RecordingNotificationButton("pause"))
      }
      add(RecordingNotificationButton("stop"))
    }
    return configured.map { button ->
      when (button.id) {
        "pause", "resume" -> {
          val id = if (paused) {
            "resume"
          } else {
            "pause"
          }
          val defaultTitle = if (paused) {
            resumeButtonTitle
          } else {
            pauseButtonTitle
          }
          button.copy(
            id = id,
            title = if (button.id == id) {
              button.title ?: defaultTitle
            } else {
              defaultTitle
            }
          )
        }
        "stop" -> button.copy(title = button.title ?: stopButtonTitle)
        else -> button
      }
    }
  }
}

@OptimizedRecord
class Metadata(
  @Field val title: String?,
  @Field val artist: String?,
  @Field val albumTitle: String?,
  @Field val artworkUrl: URL?
) : Record

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

@OptimizedRecord
class AudioLockScreenOptions(
  @Field val showSeekForward: Boolean,
  @Field val showSeekBackward: Boolean,
  @Field val showNextTrack: Boolean = false,
  @Field val showPreviousTrack: Boolean = false,
  @Field val isLiveStream: Boolean? = null,
  @Field val seekForwardIntervalSeconds: Double = 10.0,
  @Field val seekBackwardIntervalSeconds: Double = 10.0
) : Record

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

@OptimizedRecord
class RecordOptions(
  @Field val atTime: Double?,
  @Field val forDuration: Double?
) : Record

enum class AudioStreamEncoding(val value: String) : Enumerable {
  FLOAT32("float32"),
  INT16("int16")
}

@OptimizedRecord
class AudioStreamOptions : Record {
  @Field var sampleRate: Int = 48000

  @Field var channels: Int = 1

  @Field var encoding: AudioStreamEncoding = AudioStreamEncoding.FLOAT32
}

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

@OptimizedRecord
class AudioStreamFileRecordingOptions : Record {
  @Field var uri: URL? = null

  @Field var directory: RecordingDirectory? = null

  @Field var format: AudioStreamFileFormat = AudioStreamFileFormat.WAV
}

@OptimizedRecord
class AudioStreamFileRecordingStartResult : Record {
  @Field var uri: URL? = null
}

@OptimizedRecord
class AudioStreamFileRecordingResult : Record {
  @Field var uri: URL? = null

  @Field var duration: Double = 0.0

  @Field var size: Long = 0L

  @Field var sampleRate: Int = 0

  @Field var channels: Int = 0

  @Field var encoding: AudioStreamEncoding = AudioStreamEncoding.FLOAT32
}
