package expo.modules.video

import android.content.Context
import android.view.SurfaceView
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.video.delegates.IgnoreSameSet
import expo.modules.video.enums.PlayerStatus
import expo.modules.video.enums.PlayerStatus.*
import expo.modules.video.playbackService.ExpoVideoPlaybackService
import expo.modules.video.playbackService.PlaybackServiceConnection
import expo.modules.video.records.PlaybackError
import expo.modules.video.records.VideoSource
import expo.modules.video.records.VolumeEvent
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference

// https://developer.android.com/guide/topics/media/media3/getting-started/migration-guide#improvements_in_media3
@UnstableApi
class VideoPlayer(val context: Context, appContext: AppContext, source: VideoSource?) : AutoCloseable, SharedObject(appContext) {
  // This improves the performance of playing DRM-protected content
  private var renderersFactory = DefaultRenderersFactory(context)
    .forceEnableMediaCodecAsynchronousQueueing()
  private var listeners: MutableList<WeakReference<VideoPlayerListener>> = mutableListOf()

  val player = ExoPlayer
    .Builder(context, renderersFactory)
    .setLooper(context.mainLooper)
    .build()

  val serviceConnection = PlaybackServiceConnection(WeakReference(player))

  var playing by IgnoreSameSet(false) { new, old ->
    sendEvent(PlayerEvent.IsPlayingChanged(new, old))
  }

  var uncommittedSource: VideoSource? = source
  private var lastLoadedSource by IgnoreSameSet<VideoSource?>(null) { new, old ->
    sendEvent(PlayerEvent.SourceChanged(new, old))
  }

  // Volume of the player if there was no mute applied.
  var userVolume = 1f
  var status: PlayerStatus = IDLE
  var requiresLinearPlayback = false
  var staysActiveInBackground = false
  var preservesPitch = false
    set(preservesPitch) {
      field = preservesPitch
      playbackParameters = applyPitchCorrection(playbackParameters)
    }
  var showNowPlayingNotification = true
    set(value) {
      field = value
      serviceConnection.playbackServiceBinder?.service?.setShowNotification(value, this.player)
    }
  var duration = 0f
  var isLive = false

  var volume: Float by IgnoreSameSet(1f) { new: Float, old: Float ->
    player.volume = if (muted) 0f else new
    userVolume = volume
    sendEvent(PlayerEvent.VolumeChanged(VolumeEvent(new, muted), VolumeEvent(old, muted)))
  }

  var muted: Boolean by IgnoreSameSet(false) { new: Boolean, old: Boolean ->
    player.volume = if (new) 0f else userVolume
    sendEvent(PlayerEvent.VolumeChanged(VolumeEvent(volume, new), VolumeEvent(volume, old)))
  }

  var playbackParameters by IgnoreSameSet(
    PlaybackParameters.DEFAULT,
    propertyMapper = { applyPitchCorrection(it) }
  ) { new: PlaybackParameters, old: PlaybackParameters ->
    player.playbackParameters = new

    if (old.speed != new.speed) {
      sendEvent(PlayerEvent.PlaybackRateChanged(new.speed, old.speed))
    }
  }

  private val playerListener = object : Player.Listener {
    override fun onIsPlayingChanged(isPlaying: Boolean) {
      this@VideoPlayer.playing = isPlaying
    }

    override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
      this@VideoPlayer.duration = 0f
      this@VideoPlayer.isLive = false
      if (reason == Player.MEDIA_ITEM_TRANSITION_REASON_REPEAT) {
        sendEvent(PlayerEvent.PlayedToEnd())
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
      if (!muted) {
        this@VideoPlayer.volume = volume
      }
    }

    override fun onPlaybackParametersChanged(playbackParameters: PlaybackParameters) {
      this@VideoPlayer.playbackParameters = playbackParameters
      super.onPlaybackParametersChanged(playbackParameters)
    }

    override fun onPlayerErrorChanged(error: PlaybackException?) {
      error?.let {
        this@VideoPlayer.duration = 0f
        this@VideoPlayer.isLive = false
        setStatus(ERROR, error)
      } ?: run {
        setStatus(playerStateToPlayerStatus(player.playbackState), null)
      }

      super.onPlayerErrorChanged(error)
    }
  }

  init {
    ExpoVideoPlaybackService.startService(appContext, context, serviceConnection)
    player.addListener(playerListener)
    VideoManager.registerVideoPlayer(this)
  }

  override fun close() {
    appContext?.reactContext?.unbindService(serviceConnection)
    serviceConnection.playbackServiceBinder?.service?.unregisterPlayer(player)
    VideoManager.unregisterVideoPlayer(this@VideoPlayer)

    appContext?.mainQueue?.launch {
      player.removeListener(playerListener)
      player.release()
    }
    uncommittedSource = null
    lastLoadedSource = null
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
    uncommittedSource?.let { videoSource ->
      val mediaSource = videoSource.toMediaSource(context)
      player.setMediaSource(mediaSource)
      player.prepare()
      lastLoadedSource = videoSource
      uncommittedSource = null
    } ?: run {
      player.clearMediaItems()
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
    val oldStatus = this.status
    this.status = status

    val playbackError = error?.let {
      PlaybackError(it)
    }

    if (playbackError == null && player.playbackState == Player.STATE_ENDED) {
      sendEvent(PlayerEvent.PlayedToEnd())
    }

    if (this.status != oldStatus) {
      sendEvent(PlayerEvent.StatusChanged(status, oldStatus, playbackError))
    }
  }

  fun addListener(videoPlayerListener: VideoPlayerListener) {
    if (listeners.all { it.get() != videoPlayerListener }) {
      listeners.add(WeakReference(videoPlayerListener))
    }
  }

  fun removeListener(videoPlayerListener: VideoPlayerListener) {
    listeners.removeAll { it.get() == videoPlayerListener }
  }

  private fun sendEvent(event: PlayerEvent) {
    // Emits to the native listeners
    event.emit(this, listeners.mapNotNull { it.get() })
    // Emits to the JS side
    emit(event.name, *event.arguments)
  }
}
