package expo.modules.video.player

import android.content.Context
import android.media.MediaMetadataRetriever
import android.view.SurfaceView
import androidx.media3.common.C
import android.webkit.URLUtil
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.Player.STATE_BUFFERING
import androidx.media3.common.Timeline
import androidx.media3.common.Tracks
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.video.IntervalUpdateClock
import expo.modules.video.IntervalUpdateEmitter
import expo.modules.video.VideoManager
import expo.modules.video.delegates.IgnoreSameSet
import expo.modules.video.enums.AudioMixingMode
import expo.modules.video.enums.PlayerStatus
import expo.modules.video.enums.PlayerStatus.*
import expo.modules.video.playbackService.ExpoVideoPlaybackService
import expo.modules.video.playbackService.PlaybackServiceConnection
import expo.modules.video.records.BufferOptions
import expo.modules.video.records.PlaybackError
import expo.modules.video.records.TimeUpdate
import expo.modules.video.records.VideoSource
import kotlinx.coroutines.launch
import java.io.FileInputStream
import java.lang.ref.WeakReference

// https://developer.android.com/guide/topics/media/media3/getting-started/migration-guide#improvements_in_media3
@UnstableApi
class VideoPlayer(val context: Context, appContext: AppContext, source: VideoSource?) : AutoCloseable, SharedObject(appContext), IntervalUpdateEmitter {
  // This improves the performance of playing DRM-protected content
  private var renderersFactory = DefaultRenderersFactory(context)
    .forceEnableMediaCodecAsynchronousQueueing()
    .setEnableDecoderFallback(true)
  private var listeners: MutableList<WeakReference<VideoPlayerListener>> = mutableListOf()
  val loadControl: VideoPlayerLoadControl = VideoPlayerLoadControl.Builder().build()

  val player = ExoPlayer
    .Builder(context, renderersFactory)
    .setLooper(context.mainLooper)
    .setLoadControl(loadControl)
    .build()

  val serviceConnection = PlaybackServiceConnection(WeakReference(this))
  val intervalUpdateClock = IntervalUpdateClock(this)

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
  var showNowPlayingNotification = false
    set(value) {
      field = value
      serviceConnection.playbackServiceBinder?.service?.setShowNotification(value, this.player)
    }
  var duration = 0f
  var isLive = false

  var volume: Float by IgnoreSameSet(1f) { new: Float, old: Float ->
    player.volume = if (muted) 0f else new
    userVolume = volume
    sendEvent(PlayerEvent.VolumeChanged(new, old))
  }

  var muted: Boolean by IgnoreSameSet(false) { new: Boolean, old: Boolean ->
    player.volume = if (new) 0f else userVolume
    sendEvent(PlayerEvent.MutedChanged(new, old))
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

  val currentOffsetFromLive: Float?
    get() {
      return if (player.currentLiveOffset == C.TIME_UNSET) {
        null
      } else {
        player.currentLiveOffset / 1000f
      }
    }

  val currentLiveTimestamp: Long?
    get() {
      val window = Timeline.Window()
      if (!player.currentTimeline.isEmpty) {
        player.currentTimeline.getWindow(player.currentMediaItemIndex, window)
      }
      if (window.windowStartTimeMs == C.TIME_UNSET) {
        return null
      }
      return window.windowStartTimeMs + player.currentPosition
    }

  var bufferOptions: BufferOptions = BufferOptions()
    set(value) {
      field = value
      loadControl.applyBufferOptions(value)
    }

  val bufferedPosition: Double
    get() {
      if (player.currentMediaItem == null) {
        return -1.0
      }
      if (player.playbackState == STATE_BUFFERING) {
        return 0.0
      }
      return player.bufferedPosition / 1000.0
    }

  var audioMixingMode: AudioMixingMode = AudioMixingMode.AUTO
    set(value) {
      val old = field
      field = value
      sendEvent(PlayerEvent.AudioMixingModeChanged(value, old))
    }

  private val playerListener = object : Player.Listener {
    override fun onIsPlayingChanged(isPlaying: Boolean) {
      this@VideoPlayer.playing = isPlaying
    }

    override fun onTracksChanged(tracks: Tracks) {
      sendEvent(PlayerEvent.TracksChanged(tracks))
      super.onTracksChanged(tracks)
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
    if (event.emitToJS) {
      emit(event.name, event.jsEventPayload)
    }
  }

  // IntervalUpdateEmitter
  override fun emitTimeUpdate() {
    appContext?.mainQueue?.launch {
      val updatePayload = TimeUpdate(player.currentPosition / 1000.0, currentOffsetFromLive, currentLiveTimestamp, bufferedPosition)
      sendEvent(PlayerEvent.TimeUpdated(updatePayload))
    }
  }

  fun toMetadataRetriever(): MediaMetadataRetriever {
    val source = uncommittedSource ?: lastLoadedSource
    val uri = source?.uri ?: throw IllegalStateException("Video source is not set")
    val stringUri = uri.toString()

    val mediaMetadataRetriever = MediaMetadataRetriever()
    if (URLUtil.isFileUrl(stringUri)) {
      mediaMetadataRetriever.setDataSource(stringUri.replace("file://", ""))
    } else if (URLUtil.isContentUrl(stringUri)) {
      context.contentResolver.openFileDescriptor(uri, "r")?.use { parcelFileDescriptor ->
        FileInputStream(parcelFileDescriptor.fileDescriptor).use { inputStream ->
          mediaMetadataRetriever.setDataSource(inputStream.fd)
        }
      }
    } else {
      mediaMetadataRetriever.setDataSource(stringUri, source.headers ?: emptyMap())
    }
    return mediaMetadataRetriever
  }
}
