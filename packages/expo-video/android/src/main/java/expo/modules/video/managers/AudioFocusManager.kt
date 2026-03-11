package expo.modules.video.managers

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import androidx.media3.common.util.UnstableApi
import expo.modules.kotlin.AppContext
import expo.modules.video.FailedToGetAudioFocusManagerException
import expo.modules.video.enums.AudioMixingMode
import expo.modules.video.player.VideoPlayer
import expo.modules.video.listeners.VideoPlayerListener
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference

@UnstableApi
class AudioFocusManager(private val appContext: AppContext) : AudioManager.OnAudioFocusChangeListener, VideoPlayerListener {
  private val audioManager by lazy {
    appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: run {
      throw FailedToGetAudioFocusManagerException()
    }
  }

  private var players: MutableList<WeakReference<VideoPlayer>> = mutableListOf()
  private var currentFocusRequest: AudioFocusRequest? = null
  private var currentMixingMode: AudioMixingMode = AudioMixingMode.MIX_WITH_OTHERS
  private val anyPlayerRequiresFocus: Boolean
    get() = players.toList().any {
      playerRequiresFocus(it)
    }

  private fun requestAudioFocus() {
    val audioMixingMode = findAudioMixingMode()

    // We don't request AudioFocus if we want to mix the audio with others
    if (audioMixingMode == AudioMixingMode.MIX_WITH_OTHERS || !anyPlayerRequiresFocus) {
      abandonAudioFocus()
      currentMixingMode = audioMixingMode
      return
    }
    val audioFocusType = when (audioMixingMode) {
      AudioMixingMode.DUCK_OTHERS -> AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
      AudioMixingMode.AUTO -> AudioManager.AUDIOFOCUS_GAIN
      AudioMixingMode.DO_NOT_MIX -> AudioManager.AUDIOFOCUS_GAIN
      else -> AudioManager.AUDIOFOCUS_GAIN
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      // We already have audio focus
      currentFocusRequest?.let {
        if (it.focusGain == audioFocusType) {
          return
        }
      }

      val newFocusRequest = AudioFocusRequest.Builder(audioFocusType).run {
        setAudioAttributes(
          AudioAttributes.Builder().run {
            setUsage(AudioAttributes.USAGE_MEDIA)
            setContentType(AudioAttributes.CONTENT_TYPE_MOVIE)
            setOnAudioFocusChangeListener(this@AudioFocusManager)
            build()
          }
        ).build()
      }
      currentFocusRequest = newFocusRequest
      audioManager.requestAudioFocus(newFocusRequest)
    } else {
      @Suppress("DEPRECATION")
      audioManager.requestAudioFocus(
        this,
        AudioManager.STREAM_MUSIC,
        audioFocusType
      )
    }
    currentMixingMode = audioMixingMode
  }

  private fun abandonAudioFocus() {
    currentFocusRequest?.let {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        audioManager.abandonAudioFocusRequest(it)
      } else {
        @Suppress("DEPRECATION")
        audioManager.abandonAudioFocus(this)
      }
    }
    currentFocusRequest = null
  }

  fun registerPlayer(player: VideoPlayer) {
    players.find { it.get() == player } ?: run {
      players.add(WeakReference(player))
    }
    player.addListener(this)
    updateAudioFocus()
  }

  fun unregisterPlayer(player: VideoPlayer) {
    player.removeListener(this)
    players.removeAll { it.get() == player }
    updateAudioFocus()
  }

  // VideoPlayerListener

  override fun onAudioMixingModeChanged(player: VideoPlayer, audioMixingMode: AudioMixingMode, oldAudioMixingMode: AudioMixingMode?) {
    requestAudioFocus()
    super.onAudioMixingModeChanged(player, audioMixingMode, oldAudioMixingMode)
  }

  override fun onIsPlayingChanged(player: VideoPlayer, isPlaying: Boolean, oldIsPlaying: Boolean?) {
    // we can't use `updateAudioFocus`, because when losing focus the videos are paused sequentially,
    // which can lead to unexpected results.
    if (!isPlaying && !anyPlayerRequiresFocus) {
      abandonAudioFocus()
    } else if (isPlaying && anyPlayerRequiresFocus) {
      requestAudioFocus()
    }
  }

  override fun onVolumeChanged(player: VideoPlayer, volume: Float, oldVolume: Float?) {
    updateAudioFocus()
  }

  override fun onMutedChanged(player: VideoPlayer, muted: Boolean, oldMuted: Boolean?) {
    updateAudioFocus()
  }

  // AudioManager.OnAudioFocusChangeListener

  override fun onAudioFocusChange(focusChange: Int) {
    when (focusChange) {
      AudioManager.AUDIOFOCUS_LOSS -> {
        appContext.mainQueue.launch {
          players.forEach {
            pausePlayerIfUnmuted(it)
          }
          currentFocusRequest = null
        }
      }

      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
        // W could pause/mix the players here individually, but we will keep the behaviour in line with iOS,
        // find the dominant audioMixingMode and apply it to all players.
        val audioMixingMode = findAudioMixingMode()
        if (audioMixingMode == AudioMixingMode.MIX_WITH_OTHERS) {
          return
        }
        appContext.mainQueue.launch {
          players.forEach {
            pausePlayerIfUnmuted(it)
          }
          currentFocusRequest = null
        }
      }

      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
        val audioMixingMode = findAudioMixingMode()

        appContext.mainQueue.launch {
          players.forEach {
            if (audioMixingMode == AudioMixingMode.DO_NOT_MIX) {
              pausePlayerIfUnmuted(it)
            } else {
              duckPlayer(it)
            }
          }
        }
      }

      AudioManager.AUDIOFOCUS_GAIN -> {
        //  TODO: For now this behaves like iOS and doesn't resume playback automatically
        //  In future versions we can add a prop to control this behavior.
        appContext.mainQueue.launch {
          players.forEach {
            unduckPlayer(it)
          }
        }
      }
    }
  }

  // Utils

  private fun playerRequiresFocus(weakPlayer: WeakReference<VideoPlayer>): Boolean {
    val player = weakPlayer?.get() ?: return false // Return false if player is null
    return (!player.muted && player.playing && player.volume > 0) || player.audioMixingMode == AudioMixingMode.DO_NOT_MIX
  }

  private fun pausePlayerIfUnmuted(weakPlayer: WeakReference<VideoPlayer>) {
    weakPlayer.get()?.let { videoPlayer ->
      if (!videoPlayer.muted) {
        appContext.mainQueue.launch {
          videoPlayer.player.pause()
        }
      }
    }
  }

  private fun duckPlayer(weakPlayer: WeakReference<VideoPlayer>) {
    weakPlayer.get()?.let { player ->
      appContext.mainQueue.launch {
        player.volume /= 2f
      }
    }
  }

  private fun unduckPlayer(weakPlayer: WeakReference<VideoPlayer>) {
    weakPlayer.get()?.let { player ->
      if (!player.muted) {
        appContext.mainQueue.launch {
          player.volume = player.userVolume
        }
      }
    }
  }

  private fun updateAudioFocus() {
    if (anyPlayerRequiresFocus || findAudioMixingMode() != currentMixingMode) {
      requestAudioFocus()
    } else {
      abandonAudioFocus()
    }
  }

  private fun findAudioMixingMode(): AudioMixingMode {
    val playersSnapshot = players.toList()

    val mixingModes = playersSnapshot.mapNotNull { player ->
      player.get()?.takeIf { it.playing }?.audioMixingMode
    }
    if (mixingModes.isEmpty()) {
      return AudioMixingMode.MIX_WITH_OTHERS
    }

    return mixingModes.reduce { currentAudioMixingMode, next ->
      next.takeIf { it.priority > currentAudioMixingMode.priority } ?: currentAudioMixingMode
    }
  }
}
