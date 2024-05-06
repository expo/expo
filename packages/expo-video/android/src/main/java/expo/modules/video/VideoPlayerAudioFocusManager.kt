package expo.modules.video

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import androidx.media3.common.util.UnstableApi
import java.lang.ref.WeakReference

@UnstableApi
class VideoPlayerAudioFocusManager(val context: Context, private val player: WeakReference<VideoPlayer>) : AudioManager.OnAudioFocusChangeListener {
  private val audioManager by lazy {
    context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: run {
      throw FailedToGetAudioFocusManagerException()
    }
  }
  private var currentFocusRequest: AudioFocusRequest? = null
  private var volumeBeforeDuck: Float = -1f

  // TODO: @behenate (SDK52) Instead of calling this explicitly in the player we should add functionality
  //  To register as a player delegate and react to player events.
  fun onPlayerChangedAudioFocusProperty(player: VideoPlayer) {
    if (player.playing && !player.muted && player.volume > 0) {
      requestAudioFocus()
    } else {
      abandonAudioFocus()
    }
  }

  fun onPlayerDestroyed() {
    abandonAudioFocus()
  }

  private fun requestAudioFocus() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      if (currentFocusRequest != null) {
        abandonAudioFocus()
      }

      val newFocusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN).run {
        setAudioAttributes(
          AudioAttributes.Builder().run {
            setUsage(AudioAttributes.USAGE_MEDIA)
            setContentType(AudioAttributes.CONTENT_TYPE_MOVIE)
            setOnAudioFocusChangeListener(this@VideoPlayerAudioFocusManager)
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

  override fun onAudioFocusChange(focusChange: Int) {
    when (focusChange) {
      AudioManager.AUDIOFOCUS_LOSS -> {
        player.get()?.player?.pause()
      }

      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
        player.get()?.player?.pause()
      }

      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
        player.get()?.let { player ->
          volumeBeforeDuck = player.player.volume
          player.volume = player.volume / 2f
          player.userVolume = player.volume
        }
      }

      AudioManager.AUDIOFOCUS_GAIN -> {
        //  TODO: For now this behaves like iOS and doesn't resume playback automatically
        //  In future versions we can add a prop to control this behavior.
        player.get()?.let { player ->
          if (player.playing && !player.muted && player.volume > 0) {
            player.volume = volumeBeforeDuck
            player.userVolume = player.volume
          }
        }
      }
    }
  }
}
