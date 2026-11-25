package expo.modules.audio

import android.content.Context
import androidx.media3.common.AudioAttributes
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.MediaSource
import androidx.media3.session.MediaSession
import expo.modules.audio.service.AudioPlaybackServiceConnection
import expo.modules.v2.legacyAppContext
import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoSharedObject
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.module
import io.github.expo.modules.v2.react.androidContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.lang.ref.WeakReference

@UnstableApi
@ExpoSharedObject
class AudioPlaylist @JS constructor(
  initialSources: List<AudioSource>,
  updateInterval: Double,
  loop: LoopMode
) : BaseAudioPlayer(updateInterval),
  LockScreenPlayable {
  private val module: AudioModule = context.module<AudioModule>() ?: throw AudioModuleNotFoundException()
  override val ref: ExoPlayer = module.runOnMain { buildPlayer(androidContext) }

  @Event(name = "playlistStatusUpdate")
  private val onPlaylistStatusUpdate = event<Map<String, Any?>>(onStartObserving = { sendStatusUpdateOnMain() })

  @Event(name = "trackChanged")
  private val onTrackChanged = event<Map<String, Any?>>()

  private var sources: MutableList<AudioSource> = initialSources.toMutableList()
  private var currentRate = 1f
  private var previousMediaItemIndex = 0

  override var isActiveForLockScreen = false
  override var metadata: Metadata? = null
  override var lockScreenOptions: AudioLockScreenOptions? = null
  override var mediaSession: MediaSession = module.runOnMain { buildBasicMediaSession(androidContext, ref) { requestPlay() } }
  override val serviceConnection = AudioPlaybackServiceConnection(WeakReference(this), legacyAppContext)
  override val supportsNextTrack = true
  override val supportsPreviousTrack = true

  val currentTrackIndex get() = ref.currentMediaItemIndex
  val trackCount get() = ref.mediaItemCount

  private var createMediaSourceForSource: ((AudioSource) -> MediaSource?)? = null

  init {
    module.runOnMain {
      installPlayerListeners()
      startUpdating()
      loopMode = loop
      setMediaSourceCreator { source ->
        module.createMediaItem(source)
      }
      loadInitialPlaylist()
      module.registerPlaylist(this)
    }
  }

  @JS("id")
  val idFromJS: String
    get() = id

  @JS("currentIndex")
  val currentIndexFromJS: Int
    get() = module.runOnMain { currentTrackIndex }

  @JS("trackCount")
  val trackCountFromJS: Int
    get() = module.runOnMain { trackCount }

  @JS("sources")
  val sourcesFromJS: List<AudioSource>
    get() = getSources()

  @JS("playing")
  val playingFromJS: Boolean
    get() = module.runOnMain { ref.isPlaying }

  @JS("muted")
  var mutedFromJS: Boolean?
    get() = isMuted
    set(muted) {
      val newMuted = muted ?: false
      isMuted = newMuted
      setVolume(
        if (newMuted) {
          0f
        } else {
          previousVolume
        }
      )
    }

  @JS("isLoaded")
  val isLoadedFromJS: Boolean
    get() = module.runOnMain { ref.playbackState == Player.STATE_READY }

  @JS("isBuffering")
  val isBufferingFromJS: Boolean
    get() = module.runOnMain { ref.playbackState == Player.STATE_BUFFERING }

  @JS("currentTime")
  val currentTimeFromJS: Double
    get() = module.runOnMain { currentTime }

  @JS("duration")
  val durationFromJS: Double
    get() = module.runOnMain { duration }

  @JS("volume")
  var volumeFromJS: Float?
    get() = module.runOnMain { ref.volume }
    set(volume) {
      setVolume(volume)
    }

  @JS("playbackRate")
  var playbackRateFromJS: Float
    get() = module.runOnMain { ref.playbackParameters.speed }
    set(rate) {
      module.appContext.mainQueue.launch {
        setPlaybackRate(rate)
      }
    }

  @JS("loop")
  var loopFromJS: LoopMode
    get() = module.runOnMain { loopMode }
    set(mode) {
      module.runOnMain {
        loopMode = mode
      }
    }

  @JS("currentStatus")
  val currentStatusFromJS: Map<String, Any?>
    get() = module.runOnMain { currentStatus() }

  @JS("isActiveForLockScreen")
  val isActiveForLockScreenFromJS: Boolean
    get() = module.runOnMain { isActiveForLockScreen }

  @JS("play")
  fun playFromJS() {
    module.runOnMain {
      module.playWithAudioFocus(this)
    }
  }

  @JS("pause")
  fun pauseFromJS() {
    module.pause(this)
  }

  @JS("next")
  fun nextFromJS() {
    module.runOnMain {
      next()
    }
  }

  @JS("previous")
  fun previousFromJS() {
    module.runOnMain {
      previous()
    }
  }

  @JS("skipTo")
  fun skipToFromJS(index: Int) {
    module.runOnMain {
      skipTo(index)
    }
  }

  @JS("seekTo")
  suspend fun seekToFromJS(seconds: Double): Unit = withContext(Dispatchers.Main) {
    seekTo(seconds)
  }

  @JS("add")
  fun addFromJS(source: AudioSource) {
    module.runOnMain {
      add(source)
    }
  }

  @JS("insert")
  fun insertFromJS(source: AudioSource, index: Int) {
    module.runOnMain {
      insert(source, index)
    }
  }

  @JS("remove")
  fun removeFromJS(index: Int) {
    module.removePlaylistTrack(this, index)
  }

  @JS("clear")
  fun clearFromJS() {
    module.clearPlaylist(this)
  }

  @JS("setActiveForLockScreen")
  fun setActiveForLockScreenFromJS(active: Boolean, metadata: Metadata?, options: AudioLockScreenOptions?) {
    module.runOnMain {
      setActiveForLockScreen(active, metadata, options)
    }
  }

  @JS("updateLockScreenMetadata")
  fun updateLockScreenMetadataFromJS(metadata: Metadata) {
    module.runOnMain {
      updateLockScreenMetadata(metadata)
    }
  }

  @JS("clearLockScreenControls")
  fun clearLockScreenControlsFromJS() {
    module.runOnMain {
      clearLockScreenControls()
    }
  }

  @JS("destroy")
  fun destroyFromJS() {
    module.destroyPlaylist(this)
  }

  override fun emitStatus(body: Map<String, Any?>) {
    onPlaylistStatusUpdate(body)
  }

  fun setMediaSourceCreator(creator: (AudioSource) -> MediaSource?) {
    this.createMediaSourceForSource = creator
  }

  fun loadInitialPlaylist() {
    val validSources = mutableListOf<AudioSource>()
    sources.forEach { source ->
      createMediaSourceForSource?.invoke(source)?.let { mediaSource ->
        validSources.add(source)
        ref.addMediaSource(mediaSource)
      }
    }
    sources = validSources
    ref.prepare()
  }

  var loopMode: LoopMode
    get() = when (ref.repeatMode) {
      Player.REPEAT_MODE_ONE -> LoopMode.SINGLE
      Player.REPEAT_MODE_ALL -> LoopMode.ALL
      else -> LoopMode.NONE
    }
    set(value) {
      ref.repeatMode = when (value) {
        LoopMode.SINGLE -> Player.REPEAT_MODE_ONE
        LoopMode.ALL -> Player.REPEAT_MODE_ALL
        LoopMode.NONE -> Player.REPEAT_MODE_OFF
      }
      sendStatusUpdate(mapOf("loop" to value.value))
    }

  fun getSources(): List<AudioSource> {
    return sources.toList()
  }

  override fun onLoadingChanged(isLoading: Boolean) {
    sendStatusUpdate(mapOf("isLoaded" to (ref.playbackState == Player.STATE_READY)))
  }

  override fun onMediaItemChanged(mediaItem: MediaItem?, reason: Int) {
    val currentIndex = ref.currentMediaItemIndex
    if (currentIndex != previousMediaItemIndex) {
      emitTrackChanged(previousMediaItemIndex, currentIndex)
      previousMediaItemIndex = currentIndex
    }
    sendStatusUpdate()
  }

  override fun onPlayerError(error: PlaybackException) {
    sendStatusUpdate(
      mapOf(
        "error" to mapOf(
          "message" to error.message,
          "code" to error.errorCode
        )
      )
    )
  }

  fun next() {
    if (ref.hasNextMediaItem()) {
      ref.seekToNextMediaItem()
    } else if (loopMode == LoopMode.ALL && trackCount > 0) {
      ref.seekToDefaultPosition(0)
    }
  }

  fun previous() {
    if (ref.hasPreviousMediaItem()) {
      ref.seekToPreviousMediaItem()
    } else if (loopMode == LoopMode.ALL && trackCount > 0) {
      ref.seekToDefaultPosition(trackCount - 1)
    }
  }

  override fun nextTrack() {
    next()
  }

  override fun previousTrack() {
    previous()
  }

  fun skipTo(index: Int) {
    if (index !in 0..<trackCount) {
      return
    }
    ref.seekToDefaultPosition(index)
  }

  fun add(source: AudioSource) {
    val mediaSource = createMediaSourceForSource?.invoke(source) ?: return
    sources.add(source)
    ref.addMediaSource(mediaSource)
    sendStatusUpdate(mapOf("trackCount" to trackCount))
  }

  fun insert(source: AudioSource, index: Int) {
    if (index !in 0..trackCount) {
      return
    }
    val mediaSource = createMediaSourceForSource?.invoke(source) ?: return
    sources.add(index, source)
    ref.addMediaSource(index, mediaSource)
    sendStatusUpdate(mapOf("trackCount" to trackCount))
  }

  fun remove(index: Int) {
    if (index !in 0..<trackCount) {
      return
    }

    sources.removeAt(index)
    ref.removeMediaItem(index)

    sendStatusUpdate(mapOf("trackCount" to trackCount))
  }

  fun clear() {
    ref.pause()
    ref.clearMediaItems()
    sources.clear()

    sendStatusUpdate(
      mapOf(
        "trackCount" to 0,
        "currentIndex" to 0,
        "playing" to false
      )
    )
  }

  override fun setPlaybackRate(rate: Float) {
    val boundedRate = rate.coerceIn(0.1f, 2.0f)
    currentRate = boundedRate
    ref.setPlaybackSpeed(boundedRate)
  }

  override fun assignBasicMediaSession() {
    mediaSession.release()
    mediaSession = buildBasicMediaSession(appContext?.reactContext ?: return, ref) { requestPlay() }
  }

  override fun currentStatus(): Map<String, Any?> {
    val isMuted = ref.volume == 0f
    val isLoaded = ref.playbackState == Player.STATE_READY
    val isBuffering = ref.playbackState == Player.STATE_BUFFERING
    val playingStatus = if (isBuffering) {
      intendedPlayingState
    } else {
      ref.isPlaying
    }

    return mapOf(
      "id" to id,
      "currentIndex" to currentTrackIndex,
      "trackCount" to trackCount,
      "currentTime" to currentTime,
      "duration" to duration,
      "playing" to playingStatus,
      "isBuffering" to isBuffering,
      "isLoaded" to if (ref.playbackState == Player.STATE_ENDED) {
        true
      } else {
        isLoaded
      },
      "playbackRate" to if (ref.isPlaying) {
        ref.playbackParameters.speed
      } else {
        currentRate
      },
      "muted" to isMuted,
      "volume" to ref.volume,
      "loop" to loopMode.value,
      "didJustFinish" to false
    )
  }

  private fun emitTrackChanged(previousIndex: Int, currentIndex: Int) {
    onTrackChanged(
      mapOf(
        "previousIndex" to previousIndex,
        "currentIndex" to currentIndex
      )
    )
    sendStatusUpdate()
  }

  override fun releasePlayer() {
    serviceConnection.release()
    mediaSession.release()
    if (isActiveForLockScreen) {
      serviceConnection.playbackServiceBinder?.service?.unregisterPlayable()
    }
    serviceConnection.unbind()
    super.releasePlayer()
  }

  companion object {
    private fun buildPlayer(context: Context): ExoPlayer =
      ExoPlayer.Builder(context, AudioRenderersFactory(context))
        .setLooper(context.mainLooper)
        .setAudioAttributes(AudioAttributes.DEFAULT, false)
        .setHandleAudioBecomingNoisy(true)
        .build()
  }
}
