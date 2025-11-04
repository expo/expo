package expo.modules.video.player

import android.content.Context
import android.media.MediaMetadataRetriever
import androidx.media3.common.C
import android.webkit.URLUtil
import androidx.annotation.OptIn
import androidx.media3.common.Format
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.PlaybackException
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.Player.STATE_BUFFERING
import androidx.media3.common.Timeline
import androidx.media3.common.TrackSelectionParameters
import androidx.media3.common.Tracks
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DecoderReuseEvaluation
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.analytics.AnalyticsListener
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector
import androidx.media3.ui.PlayerView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.video.IntervalUpdateClock
import expo.modules.video.IntervalUpdateEmitter
import expo.modules.video.VideoManager
import expo.modules.video.delegates.IgnoreSameSet
import expo.modules.video.enums.AudioMixingMode
import expo.modules.video.enums.PlayerStatus
import expo.modules.video.enums.PlayerStatus.*
import expo.modules.video.getPlaybackServiceErrorMessage
import expo.modules.video.playbackService.ExpoVideoPlaybackService
import expo.modules.video.playbackService.PlaybackServiceConnection
import expo.modules.video.records.BufferOptions
import expo.modules.video.records.PlaybackError
import expo.modules.video.records.TimeUpdate
import expo.modules.video.records.VideoSource
import expo.modules.video.utils.MutableWeakReference
import expo.modules.video.records.VideoTrack
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
  private var currentPlayerView = MutableWeakReference<PlayerView?>(null)
  val loadControl: VideoPlayerLoadControl = VideoPlayerLoadControl()
  val subtitles: VideoPlayerSubtitles = VideoPlayerSubtitles(this)
  val audioTracks: VideoPlayerAudioTracks = VideoPlayerAudioTracks(this)
  val trackSelector = DefaultTrackSelector(context)

  val player = ExoPlayer
    .Builder(context, renderersFactory)
    .setLooper(context.mainLooper)
    .setLoadControl(loadControl)
    .build()

  private val firstFrameEventGenerator = createFirstFrameEventGenerator()
  val serviceConnection = PlaybackServiceConnection(WeakReference(this), appContext)
  val intervalUpdateClock = IntervalUpdateClock(this)

  var hasRenderedAFrameOfVideoSource = false
  var playing by IgnoreSameSet(false) { new, old ->
    sendEvent(PlayerEvent.IsPlayingChanged(new, old))
  }

  var uncommittedSource: VideoSource? = source
  private var commitedSource by IgnoreSameSet<VideoSource?>(null) { new, old ->
    sendEvent(PlayerEvent.SourceChanged(new, old))
  }

  // Volume of the player if there was no mute applied.
  var userVolume = 1f
  var status: PlayerStatus = IDLE
  var requiresLinearPlayback = false
  var staysActiveInBackground = false
    set(value) {
      field = value
      if (value) {
        startPlaybackService()
      }
    }
  var preservesPitch = false
    set(preservesPitch) {
      field = preservesPitch
      playbackParameters = applyPitchCorrection(playbackParameters)
    }
  var showNowPlayingNotification = false
    set(value) {
      field = value
      serviceSetShowNotification(value)
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

  var isLoadingNewSource = false
    private set

  var currentVideoTrack: VideoTrack? = null
    private set(value) {
      val old = field
      field = value
      sendEvent(PlayerEvent.VideoTrackChanged(value, old))
    }

  var availableVideoTracks: List<VideoTrack> = emptyList()
    private set

  var keepScreenOnWhilePlaying by VideoPlayerKeepAwake(this, appContext)

  private val playerListener = object : Player.Listener {
    override fun onIsPlayingChanged(isPlaying: Boolean) {
      this@VideoPlayer.playing = isPlaying
    }

    override fun onTracksChanged(tracks: Tracks) {
      val oldSubtitleTracks = ArrayList(subtitles.availableSubtitleTracks)
      val oldAudioTracks = ArrayList(audioTracks.availableAudioTracks)
      val oldCurrentTrack = subtitles.currentSubtitleTrack
      val oldCurrentAudioTrack = audioTracks.currentAudioTrack

      // Emit the tracks change event to update the subtitles
      sendEvent(PlayerEvent.TracksChanged(tracks))

      val newSubtitleTracks = subtitles.availableSubtitleTracks
      val newAudioTracks = audioTracks.availableAudioTracks
      val newCurrentSubtitleTrack = subtitles.currentSubtitleTrack
      val newCurrentAudioTrack = audioTracks.currentAudioTrack
      availableVideoTracks = tracks.toVideoTracks()

      if (isLoadingNewSource) {
        sendEvent(
          PlayerEvent.VideoSourceLoaded(
            commitedSource,
            this@VideoPlayer.player.duration / 1000.0,
            availableVideoTracks,
            newSubtitleTracks,
            newAudioTracks
          )
        )
        isLoadingNewSource = false
      }

      if (!oldSubtitleTracks.toArray().contentEquals(newSubtitleTracks.toArray())) {
        sendEvent(PlayerEvent.AvailableSubtitleTracksChanged(newSubtitleTracks, oldSubtitleTracks))
      }
      if (!oldAudioTracks.toArray().contentEquals(newAudioTracks.toArray())) {
        sendEvent(PlayerEvent.AvailableAudioTracksChanged(newAudioTracks, oldAudioTracks))
      }
      if (oldCurrentTrack != newCurrentSubtitleTrack) {
        sendEvent(PlayerEvent.SubtitleTrackChanged(newCurrentSubtitleTrack, oldCurrentTrack))
      }
      if (oldCurrentAudioTrack != newCurrentAudioTrack) {
        sendEvent(PlayerEvent.AudioTrackChanged(newCurrentAudioTrack, oldCurrentAudioTrack))
      }
      super.onTracksChanged(tracks)
    }

    override fun onTrackSelectionParametersChanged(parameters: TrackSelectionParameters) {
      val oldTrack = subtitles.currentSubtitleTrack
      val oldAudioTrack = audioTracks.currentAudioTrack
      sendEvent(PlayerEvent.TrackSelectionParametersChanged(parameters))

      val newTrack = subtitles.currentSubtitleTrack
      val newAudioTrack = audioTracks.currentAudioTrack
      sendEvent(PlayerEvent.SubtitleTrackChanged(newTrack, oldTrack))
      sendEvent(PlayerEvent.AudioTrackChanged(newAudioTrack, oldAudioTrack))
      super.onTrackSelectionParametersChanged(parameters)
    }

    override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
      if (reason == Player.MEDIA_ITEM_TRANSITION_REASON_REPEAT) {
        sendEvent(PlayerEvent.PlayedToEnd())
      } else {
        // New playback info is set in the onPlaybackStateChanged event, which occurs after mediaItemTransition.
        // The onPlaybackStateChanged is not triggered if the video repeats (since the state remains STATE_READY)
        // That is why the playback info is not reset when the transition reason is MEDIA_ITEM_TRANSITION_REASON_REPEAT.
        resetPlaybackInfo()
      }
      subtitles.setSubtitlesEnabled(false)
      hasRenderedAFrameOfVideoSource = false
      super.onMediaItemTransition(mediaItem, reason)
    }

    override fun onPlaybackStateChanged(@Player.State playbackState: Int) {
      if (playbackState == Player.STATE_IDLE && player.playerError != null) {
        return
      }
      if (playbackState == Player.STATE_READY) {
        refreshPlaybackInfo()
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
        resetPlaybackInfo()
        setStatus(ERROR, error)
      } ?: run {
        setStatus(playerStateToPlayerStatus(player.playbackState), null)
      }

      super.onPlayerErrorChanged(error)
    }
  }

  private val analyticsListener = object : AnalyticsListener {
    override fun onVideoInputFormatChanged(eventTime: AnalyticsListener.EventTime, format: Format, decoderReuseEvaluation: DecoderReuseEvaluation?) {
      currentVideoTrack = availableVideoTracks.firstOrNull { it.format?.id == format.id }
      super.onVideoInputFormatChanged(eventTime, format, decoderReuseEvaluation)
    }
  }

  init {
    player.addListener(playerListener)
    player.addAnalyticsListener(analyticsListener)
    VideoManager.registerVideoPlayer(this)

    // ExoPlayer will enable subtitles automatically at the start, we want them disabled by default
    appContext.mainQueue.launch {
      subtitles.setSubtitlesEnabled(false)
    }
  }

  override fun close() {
    if (serviceConnection.isConnected) {
      appContext?.reactContext?.unbindService(serviceConnection)
    }
    serviceConnection.playbackServiceBinder?.service?.unregisterPlayer(player)
    VideoManager.unregisterVideoPlayer(this@VideoPlayer)

    appContext?.mainQueue?.launch {
      player.removeListener(playerListener)
      player.release()
    }
    uncommittedSource = null
    commitedSource = null
    // Releases the listeners from VideoPlayerKeepAwake
    keepScreenOnWhilePlaying = false
  }

  override fun deallocate() {
    super.deallocate()
    close()
  }

  /**
   * Used to notify the player that is has been disconnected from the player view by another player.
   */
  fun hasBeenDisconnectedFromPlayerView() {
    if (currentPlayerView.get()?.player == this.player) {
      throw IllegalStateException("The player has been notified of disconnection from the player view, even though it's still connected.")
    }
    currentPlayerView.set(null)
  }

  fun changePlayerView(playerView: PlayerView?) {
    PlayerView.switchTargetView(player, currentPlayerView.get(), playerView)
    currentPlayerView.set(playerView)
  }

  fun prepare() {
    availableVideoTracks = listOf()
    currentVideoTrack = null

    val newSource = uncommittedSource
    val mediaSource = newSource?.toMediaSource(context)

    mediaSource?.let {
      player.setMediaSource(it)
      player.prepare()
      commitedSource = newSource
      uncommittedSource = null
      isLoadingNewSource = true
    } ?: run {
      player.clearMediaItems()
      player.prepare()
      isLoadingNewSource = false
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

  private fun refreshPlaybackInfo() {
    duration = player.duration / 1000f
    isLive = player.isCurrentMediaItemLive
  }

  private fun resetPlaybackInfo() {
    duration = 0f
    isLive = false
  }

  private fun startPlaybackService(): Boolean {
    if (serviceConnection.playbackServiceBinder?.service != null) {
      // PlaybackService already running.
      return true
    }
    val appContext = appContext ?: throw Exceptions.AppContextLost()
    val serviceStarted = ExpoVideoPlaybackService.startService(appContext, context, serviceConnection)

    if (!serviceStarted) {
      appContext.jsLogger?.error(
        getPlaybackServiceErrorMessage("Expo-video has failed to bind with the playback service binder")
      )
    }
    return serviceStarted
  }

  private fun serviceSetShowNotification(showNotification: Boolean) {
    if (showNotification) {
      startPlaybackService()
    }
    serviceConnection.playbackServiceBinder?.service?.setShowNotification(showNotification, this.player)
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
    val listenersSnapshot = listeners.toList().mapNotNull { it.get() }

    event.emit(this, listenersSnapshot)

    // Emits to the JS side
    if (event.emitToJS) {
      emit(event.name, event.jsEventPayload)
    }
  }

  private fun createFirstFrameEventGenerator(): FirstFrameEventGenerator {
    return FirstFrameEventGenerator(player, currentPlayerView) {
      hasRenderedAFrameOfVideoSource = true
      sendEvent(PlayerEvent.RenderedFirstFrame())
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
    val source = uncommittedSource ?: commitedSource
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

// Extension functions

@OptIn(UnstableApi::class)
private fun Tracks.toVideoTracks(): List<VideoTrack> {
  val videoTracks = mutableListOf<VideoTrack?>()
  for (group in this.groups) {
    for (i in 0 until group.length) {
      val format = group.getTrackFormat(i)
      val isSupported = group.isTrackSupported(i)

      if (!MimeTypes.isVideo(format.sampleMimeType)) {
        continue
      }
      videoTracks.add(VideoTrack.fromFormat(format, isSupported))
    }
  }
  return videoTracks.filterNotNull()
}
