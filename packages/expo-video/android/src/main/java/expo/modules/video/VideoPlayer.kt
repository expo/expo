package expo.modules.video

import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.Context.BIND_AUTO_CREATE
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import android.util.Log
import android.view.SurfaceView
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.Timeline
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSessionService
import androidx.media3.ui.PlayerView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.sharedobjects.SharedObject

// https://developer.android.com/guide/topics/media/media3/getting-started/migration-guide#improvements_in_media3
@UnstableApi
class VideoPlayer(context: Context, private val appContext: AppContext, private val mediaItem: MediaItem) : AutoCloseable, SharedObject() {
  private val currentActivity: Activity by lazy {
    appContext.activityProvider?.currentActivity
      ?: throw Exceptions.MissingActivity()
  }

  // This improves the performance of playing DRM-protected content
  private var renderersFactory = DefaultRenderersFactory(context)
    .forceEnableMediaCodecAsynchronousQueueing()

  private var loadControl = DefaultLoadControl.Builder()
    .setPrioritizeTimeOverSizeThresholds(false)
    .build()

  val player = ExoPlayer
    .Builder(context, renderersFactory)
    .setLooper(context.mainLooper)
    .setLoadControl(loadControl)
    .build()

  // We duplicate some properties of the player, because we don't want to always use the mainQueue to access them.
  var isPlaying = false
  var isLoading = true

  // Volume of the player if there was no mute applied.
  var userVolume = 1f
  var requiresLinearPlayback = false
  var staysActiveInBackground = false
  private var serviceConnection: ServiceConnection
  internal var playbackServiceBinder: PlaybackServiceBinder? = null
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
    val intent = Intent(context, ExpoVideoPlaybackService::class.java)

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
    intent.action = MediaSessionService.SERVICE_INTERFACE
    currentActivity.startService(intent)
    currentActivity.bindService(intent, serviceConnection, BIND_AUTO_CREATE)
    player.addListener(playerListener)
    VideoManager.registerVideoPlayer(this)
  }

  override fun close() {
    player.removeListener(playerListener)
    currentActivity.unbindService(serviceConnection)
    playbackServiceBinder?.service?.unregisterPlayer(player)
    VideoManager.unregisterVideoPlayer(this)
    player.release()
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
