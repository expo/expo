package expo.modules.audio

import android.Manifest
import android.app.Activity
import android.content.Context
import android.media.AudioManager
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlin.math.min

const val recordingStatus = "onRecordingStatusUpdate"
const val playbackStatus = "onPlaybackStatusUpdate"

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
class AudioModule : Module(), AudioManager.OnAudioFocusChangeListener {
  private val activity: Activity
    get() = appContext.activityProvider?.currentActivity ?: throw Exceptions.MissingActivity()
  private lateinit var audioManager: AudioManager

  override fun definition() = ModuleDefinition {
    Name("ExpoAudio")

    OnCreate {
      audioManager = appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    }

    AsyncFunction("setAudioModeAsync") { mode: AudioMode ->

    }

    AsyncFunction("setIsAudioActiveAsync") { enabled: Boolean ->
      audioManager.abandonAudioFocus(this@AudioModule)
    }

    AsyncFunction("requestRecordingPermissionsAsync") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.RECORD_AUDIO)
    }

    AsyncFunction("getRecordingPermissionsAsync") { promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.RECORD_AUDIO)
    }

    Class(AudioPlayer::class) {
      Constructor { source: AudioSource ->
        return@Constructor runBlocking(appContext.mainQueue.coroutineContext) {
          AudioPlayer(
            activity.applicationContext,
            appContext,
            MediaItem.Builder()
              .setUri(source.uri ?: "")
              .build()
          )
        }
      }

      Events(playbackStatus)

      Property("id") { ref ->
        ref.sharedObjectId.value
      }

      Property("isBuffering") { ref ->
        runBlocking(appContext.mainQueue.coroutineContext) {
          ref.player.playbackState == Player.STATE_BUFFERING
        }
      }

      Property("loop") { ref ->
        runBlocking(appContext.mainQueue.coroutineContext) {
          ref.player.repeatMode == Player.REPEAT_MODE_ONE
        }
      }.set { ref, isLooping: Boolean ->
        appContext.mainQueue.launch {
          ref.player.repeatMode = if (isLooping) {
            Player.REPEAT_MODE_ONE
          } else {
            Player.REPEAT_MODE_OFF
          }
        }
      }

      Property("isLoaded") { ref ->
        runBlocking(appContext.mainQueue.coroutineContext) {
          ref.player.playbackState == Player.STATE_READY
        }
      }

      Property("isPlaying") { ref ->
        runBlocking(appContext.mainQueue.coroutineContext) {
          ref.player.isPlaying
        }
      }

      Property("muted") { ref ->
        runBlocking(appContext.mainQueue.coroutineContext) {
          ref.player.volume == 0f
        }
      }

      Property("shouldCorrectPitch") { ref ->
        ref.preservesPitch
      }.set { ref, preservesPitch: Boolean ->
        ref.preservesPitch = preservesPitch
      }

      Property("currentTime") { ref ->
        runBlocking(appContext.mainQueue.coroutineContext) {
          ref.player.currentPosition
        }
      }

      Property("duration") { ref ->
        runBlocking(appContext.mainQueue.coroutineContext) {
          ref.player.duration
        }
      }

      Property("playbackRate") { ref ->
        runBlocking(appContext.mainQueue.coroutineContext) {
          ref.player.playbackParameters.speed
        }
      }.set { ref, rate: Float ->
        appContext.mainQueue.launch {
          ref.player.playbackParameters = PlaybackParameters(rate)
        }
      }

      Property("volume") { ref ->
        runBlocking(appContext.mainQueue.coroutineContext) {
          ref.player.volume
        }
      }.set { ref, volume: Float ->
        appContext.mainQueue.launch {
          ref.player.volume = volume
        }
      }

      Function("play") { ref: AudioPlayer ->
        appContext.mainQueue.launch {
          ref.player.play()
        }
      }

      Function("pause") { ref: AudioPlayer ->
        appContext.mainQueue.launch {
          ref.player.pause()
        }
      }

      Function("seekTo") { ref: AudioPlayer, seekTime: Double ->
        appContext.mainQueue.launch {
          ref.player.seekTo(seekTime.toLong())
        }
      }

      Function("setPlaybackRate") { ref: AudioPlayer, rate: Float ->
        appContext.mainQueue.launch {
          val playbackRate = if (rate < 0) 0f else min(rate, 2.0f)
          val pitch = if (ref.preservesPitch) 1f else playbackRate
          ref.player.playbackParameters = PlaybackParameters(playbackRate, pitch)
        }
      }
    }

//    Class(AudioRecorder::class) {
//      Events(recordingStatus)
//
//
//    }
  }

  override fun onAudioFocusChange(focusChange: Int) {
//    when (focusChange) {
//      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
//        if (mShouldDuckAudio) {
//          mIsDuckingAudio = true
//          mAcquiredAudioFocus = true
//          updateDuckStatusForAllPlayersPlaying()
//          break
//        }
//        mIsDuckingAudio = false
//        mAcquiredAudioFocus = false
//        for (handler in getAllRegisteredAudioEventHandlers()) {
//          handler.handleAudioFocusInterruptionBegan()
//        }
//      }
//
//      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT, AudioManager.AUDIOFOCUS_LOSS -> {
//        mIsDuckingAudio = false
//        mAcquiredAudioFocus = false
//        for (handler in getAllRegisteredAudioEventHandlers()) {
//          handler.handleAudioFocusInterruptionBegan()
//        }
//      }
//
//      AudioManager.AUDIOFOCUS_GAIN -> {
//        mIsDuckingAudio = false
//        mAcquiredAudioFocus = true
//        for (handler in getAllRegisteredAudioEventHandlers()) {
//          handler.handleAudioFocusGained()
//        }
//      }
//    }
  }
}
