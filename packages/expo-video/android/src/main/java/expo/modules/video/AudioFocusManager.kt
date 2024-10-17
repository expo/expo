package expo.modules.video

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import androidx.media3.common.util.UnstableApi
import expo.modules.kotlin.AppContext
import expo.modules.video.player.VideoPlayer
import expo.modules.video.player.VideoPlayerListener
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
  private val anyPlayerRequiresFocus: Boolean
    get() = players.any {
      playerRequiresFocus(it)
    }

  private fun requestAudioFocus() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      // We already have audio focus
      if (currentFocusRequest != null) {
        return
      }

      val newFocusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN).run {
        setAudioAttributes(
          AudioAttributes.Builder().run {
            setUsage(AudioAttributes.USAGE_MEDIA)
            setContentType(AudioAttributes.CONTENT_TYPE_MOVIE)
            setOnAudioFocusChangeListener(this@AudioFocusManager)
            build()
          }
        ).build()
      }
      this.currentFocusRequest = newFocusRequest
      audioManager.requestAudioFocus(newFocusRequest)
    } else {
      @Suppress("DEPRECATION")
      audioManager.requestAudioFocus(
        this,
        AudioManager.STREAM_MUSIC,
        AudioManager.AUDIOFOCUS_GAIN
      )
    }
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
        appContext.mainQueue.launch {
          players.forEach {
            pausePlayerIfUnmuted(it)
          }
          currentFocusRequest = null
        }
      }

      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
        appContext.mainQueue.launch {
          players.forEach {
            duckPlayer(it)
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
    return weakPlayer.get()?.let {
      !it.muted && it.playing && it.volume > 0
    } ?: run {
      false
    }
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
    if (anyPlayerRequiresFocus) {
      requestAudioFocus()
    } else {
      abandonAudioFocus()
    }
  }
}
