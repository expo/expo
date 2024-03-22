package expo.modules.video

import android.content.ComponentName
import android.content.Context
import android.content.Context.BIND_AUTO_CREATE
import android.content.Intent
import android.content.ServiceConnection
import android.os.Build
import android.os.IBinder
import android.util.Log
import android.view.SurfaceView
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.Timeline
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSessionService
import androidx.media3.ui.PlayerView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject
import kotlinx.coroutines.launch

// https://developer.android.com/guide/topics/media/media3/getting-started/migration-guide#improvements_in_media3
@UnstableApi
class VideoPlayer(context: Context, appContext: AppContext, private val mediaItem: MediaItem) : AutoCloseable, SharedObject(appContext) {
  // This improves the performance of playing DRM-protected content
  private var renderersFactory = DefaultRenderersFactory(context)
    .forceEnableMediaCodecAsynchronousQueueing()

  val player = ExoPlayer
    .Builder(context, renderersFactory)
    .setLooper(context.mainLooper)
    .build()

  // We duplicate some properties of the player, because we don't want to always use the mainQueue to access them.
  var playing = false
  var isLoading = true

  // Volume of the player if there was no mute applied.
  var userVolume = 1f
  var requiresLinearPlayback = false
  var staysActiveInBackground = false
  var preservesPitch = false
    set(preservesPitch) {
      applyPitchCorrection()
      field = preservesPitch
    }

  private var serviceConnection: ServiceConnection
  internal var playbackServiceBinder: PlaybackServiceBinder? = null
  lateinit var timeline: Timeline

  var volume = 1f
    set(volume) {
      if (player.volume == volume) return
      player.volume = if (muted) 0f else volume
      field = volume
    }

  var muted = false
    set(muted) {
      field = muted
      volume = if (muted) 0f else userVolume
    }

  var playbackParameters: PlaybackParameters = PlaybackParameters.DEFAULT
    set(value) {
      if (player.playbackParameters == value) return
      player.playbackParameters = value
      field = value
      applyPitchCorrection()
    }

  private val playerListener = object : Player.Listener {
    override fun onIsPlayingChanged(isPlaying: Boolean) {
      this@VideoPlayer.playing = isPlaying
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
    serviceConnection = object : ServiceConnection {
      override fun onServiceConnected(componentName: ComponentName, binder: IBinder) {
        playbackServiceBinder = binder as? PlaybackServiceBinder
        playbackServiceBinder?.service?.registerPlayer(player) ?: run {
          Log.w(
            "ExpoVideo",
            "Expo Video could not bind to the playback service. " +
              "This will cause issues with playback notifications and sustaining background playback."
          )
        }
      }

      override fun onServiceDisconnected(componentName: ComponentName) {
        playbackServiceBinder = null
      }

      override fun onNullBinding(componentName: ComponentName) {
        Log.w(
          "ExpoVideo",
          "Expo Video could not bind to the playback service. " +
            "This will cause issues with playback notifications and sustaining background playback."
        )
      }
    }

    appContext.reactContext?.apply {
      val intent = Intent(context, ExpoVideoPlaybackService::class.java)
      intent.action = MediaSessionService.SERVICE_INTERFACE

      startService(intent)

      val flags = if (Build.VERSION.SDK_INT >= 29) {
        BIND_AUTO_CREATE or Context.BIND_INCLUDE_CAPABILITIES
      } else {
        BIND_AUTO_CREATE
      }

      bindService(intent, serviceConnection, flags)
    }
    player.addListener(playerListener)
    VideoManager.registerVideoPlayer(this)
  }

  override fun close() {
    appContext?.reactContext?.unbindService(serviceConnection)
    playbackServiceBinder?.service?.unregisterPlayer(player)
    VideoManager.unregisterVideoPlayer(this@VideoPlayer)

    appContext?.mainQueue?.launch {
      player.removeListener(playerListener)
      player.release()
    }
  }

  override fun deallocate() {
    super.deallocate()
    close()
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

  private fun applyPitchCorrection() {
    val speed = playbackParameters.speed
    val pitch = if (preservesPitch) 1f else speed
    playbackParameters = PlaybackParameters(speed, pitch)
  }
}
