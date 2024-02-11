package expo.modules.video

import android.content.Context
import android.view.SurfaceView
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.Timeline
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import expo.modules.kotlin.sharedobjects.SharedObject

// https://developer.android.com/guide/topics/media/media3/getting-started/migration-guide#improvements_in_media3
@UnstableApi
class VideoPlayer(context: Context, private val mediaItem: MediaItem) : AutoCloseable, SharedObject() {
  val player = ExoPlayer.Builder(context).setLooper(context.mainLooper).build()

  // We duplicate some properties of the player, because we don't want to always use the mainQueue to access them.
  var isPlaying = false
  var isLoading = true

  // Volume of the player if there was no mute applied.
  var userVolume = 1f
  var requiresLinearPlayback = false
  lateinit var timeline: Timeline

  var volume = 1f
    set(volume) {
      if (player.volume == volume) return
      player.volume = if (isMuted) 0f else volume
      field = volume
    }

  var isMuted = false
    set(isMuted) {
      field = isMuted
      volume = if (isMuted) 0f else userVolume
    }

  var playbackParameters: PlaybackParameters = PlaybackParameters.DEFAULT
    set(value) {
      if (player.playbackParameters == value) return
      player.playbackParameters = value
      field = value
    }

  private val playerListener = object : Player.Listener {
    override fun onIsPlayingChanged(isPlaying: Boolean) {
      this@VideoPlayer.isPlaying = isPlaying
    }

    override fun onTimelineChanged(timeline: Timeline, reason: Int) {
      this@VideoPlayer.timeline = timeline
    }

    override fun onIsLoadingChanged(isLoading: Boolean) {
      this@VideoPlayer.isLoading = isLoading
    }

    override fun onVolumeChanged(volume: Float) {
      this@VideoPlayer.volume = volume
    }

    override fun onPlaybackParametersChanged(playbackParameters: PlaybackParameters) {
      this@VideoPlayer.playbackParameters = playbackParameters
      super.onPlaybackParametersChanged(playbackParameters)
    }
  }

  init {
    player.addListener(playerListener)
  }

  override fun close() {
    player.removeListener(playerListener)
  }

  fun changePlayerView(playerView: PlayerView) {
    player.clearVideoSurface()
    player.setVideoSurfaceView(playerView.videoSurfaceView as SurfaceView?)
    playerView.player = player
  }

  fun prepare() {
    player.setMediaItem(mediaItem)
    player.prepare()
  }
}
