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
import androidx.media3.common.PlaybackException
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
import expo.modules.video.enums.PlayerStatus
import expo.modules.video.enums.PlayerStatus.*
import expo.modules.video.records.PlaybackError
import expo.modules.video.records.VideoSource
import expo.modules.video.records.VolumeEvent
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference

// https://developer.android.com/guide/topics/media/media3/getting-started/migration-guide#improvements_in_media3
@UnstableApi
class VideoPlayer(context: Context, appContext: AppContext, source: VideoSource?) : AutoCloseable, SharedObject(appContext) {
  // This improves the performance of playing DRM-protected content
  private var renderersFactory = DefaultRenderersFactory(context)
    .forceEnableMediaCodecAsynchronousQueueing()
  val audioFocusManager = VideoPlayerAudioFocusManager(context, WeakReference(this))
  val player = ExoPlayer
    .Builder(context, renderersFactory)
    .setLooper(context.mainLooper)
    .build()

  // We duplicate some properties of the player, because we don't want to always use the mainQueue to access them.
  var playing = false
    set(value) {
      if (field != value) {
        sendEventOnJSThread("playingChange", value, field)
      }
      field = value
    }

  // This is used only for sending events and keeping the reference to the video source for the
  // VideoManager, which holds weak references. Changing this will not affect the player.
  var videoSource: VideoSource? = source
    set(videoSource) {
      if (field != videoSource) {
        sendEventOnJSThread("sourceChange", videoSource, field)
      }
      field = videoSource
    }

  // Volume of the player if there was no mute applied.
  var userVolume = 1f
  var status: PlayerStatus = IDLE
  var requiresLinearPlayback = false
  var staysActiveInBackground = false
  var preservesPitch = false
    set(preservesPitch) {
      playbackParameters = applyPitchCorrection(playbackParameters)
      field = preservesPitch
    }
  var showNowPlayingNotification = true
    set(value) {
      field = value
      playbackServiceBinder?.service?.setShowNotification(value, this.player)
    }
  var duration = 0f
  var isLive = false

  private var serviceConnection: ServiceConnection
  internal var playbackServiceBinder: PlaybackServiceBinder? = null
  lateinit var timeline: Timeline

  var volume = 1f
    set(volume) {
      if (player.volume == volume) return
      player.volume = if (muted) 0f else volume
      sendEventOnJSThread("volumeChange", VolumeEvent(volume, muted), VolumeEvent(field, muted))
      field = volume
    }

  var muted = false
    set(muted) {
      if (field == muted) return
      sendEventOnJSThread("volumeChange", VolumeEvent(volume, muted), VolumeEvent(volume, field))
      player.volume = if (muted) 0f else userVolume
      field = muted
      audioFocusManager.onPlayerChangedAudioFocusProperty(this@VideoPlayer)
    }

  var playbackParameters: PlaybackParameters = PlaybackParameters.DEFAULT
    set(newPlaybackParameters) {
      if (playbackParameters.speed != newPlaybackParameters.speed) {
        sendEventOnJSThread("playbackRateChange", newPlaybackParameters.speed, playbackParameters.speed)
      }
      val pitchCorrectedPlaybackParameters = applyPitchCorrection(newPlaybackParameters)
      field = pitchCorrectedPlaybackParameters

      if (player.playbackParameters != pitchCorrectedPlaybackParameters) {
        player.playbackParameters = pitchCorrectedPlaybackParameters
      }
    }

  private val playerListener = object : Player.Listener {
    override fun onIsPlayingChanged(isPlaying: Boolean) {
      this@VideoPlayer.playing = isPlaying
      audioFocusManager.onPlayerChangedAudioFocusProperty(this@VideoPlayer)
    }

    override fun onTimelineChanged(timeline: Timeline, reason: Int) {
      this@VideoPlayer.timeline = timeline
    }

    override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
      val newVideoSource = VideoManager.getVideoSourceFromMediaItem(mediaItem)
      this@VideoPlayer.videoSource = newVideoSource
      this@VideoPlayer.duration = 0f
      this@VideoPlayer.isLive = false
      if (reason == Player.MEDIA_ITEM_TRANSITION_REASON_REPEAT) {
        sendEventOnJSThread("playToEnd")
      }
      super.onMediaItemTransition(mediaItem, reason)
    }

    override fun onPlaybackStateChanged(@Player.State playbackState: Int) {
      if (playbackState == Player.STATE_IDLE && player.playerError != null) {
        return
      }
      if (playbackState == Player.STATE_READY) {
        this@VideoPlayer.duration = this@VideoPlayer.player.duration / 1000f
        this@VideoPlayer.isLive = this@VideoPlayer.player.isCurrentMediaItemLive
      }
      setStatus(playerStateToPlayerStatus(playbackState), null)
      super.onPlaybackStateChanged(playbackState)
    }

    override fun onVolumeChanged(volume: Float) {
      this@VideoPlayer.volume = volume
      audioFocusManager.onPlayerChangedAudioFocusProperty(this@VideoPlayer)
    }

    override fun onPlaybackParametersChanged(playbackParameters: PlaybackParameters) {
      this@VideoPlayer.playbackParameters = playbackParameters
      super.onPlaybackParametersChanged(playbackParameters)
    }

    override fun onPlayerErrorChanged(error: PlaybackException?) {
      error?.let {
        setStatus(ERROR, error)
        this@VideoPlayer.duration = 0f
        this@VideoPlayer.isLive = false
      } ?: run {
        setStatus(playerStateToPlayerStatus(player.playbackState), null)
      }

      super.onPlayerErrorChanged(error)
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
    audioFocusManager.onPlayerDestroyed()
    appContext?.reactContext?.unbindService(serviceConnection)
    playbackServiceBinder?.service?.unregisterPlayer(player)
    VideoManager.unregisterVideoPlayer(this@VideoPlayer)

    appContext?.mainQueue?.launch {
      player.removeListener(playerListener)
      player.release()
    }
    videoSource = null
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
    videoSource?.let { videoSource ->
      val mediaItem = videoSource.toMediaItem()
      VideoManager.registerVideoSourceToMediaItem(mediaItem, videoSource)
      player.setMediaItem(mediaItem)
      player.prepare()
    } ?: run {
      player.removeMediaItem(0)
      player.prepare()
    }
  }

  private fun applyPitchCorrection(playbackParameters: PlaybackParameters): PlaybackParameters {
    val speed = playbackParameters.speed
    val pitch = if (preservesPitch) 1f else speed
    return PlaybackParameters(speed, pitch)
  }

  private fun playerStateToPlayerStatus(@Player.State state: Int): PlayerStatus {
    return when (state) {
      Player.STATE_IDLE -> IDLE
      Player.STATE_BUFFERING -> LOADING
      Player.STATE_READY -> READY_TO_PLAY
      Player.STATE_ENDED -> {
        // When an error occurs, the player state changes to ENDED.
        if (player.playerError != null) {
          ERROR
        } else {
          IDLE
        }
      }

      else -> IDLE
    }
  }
  private fun setStatus(status: PlayerStatus, error: PlaybackException?) {
    val playbackError = error?.let {
      PlaybackError(it)
    }

    if (playbackError == null && player.playbackState == Player.STATE_ENDED) {
      sendEventOnJSThread("playToEnd")
    }

    if (this.status != status) {
      sendEventOnJSThread("statusChange", status.value, this.status.value, playbackError)
    }
    this.status = status
  }

  private fun sendEventOnJSThread(eventName: String, vararg args: Any?) {
    appContext?.executeOnJavaScriptThread {
      sendEvent(eventName, *args)
    }
  }
}
