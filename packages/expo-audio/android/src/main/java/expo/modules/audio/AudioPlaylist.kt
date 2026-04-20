package expo.modules.audio

import android.content.Context
import androidx.media3.common.AudioAttributes
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.datasource.DataSource
import expo.modules.kotlin.AppContext

private const val PLAYLIST_STATUS_UPDATE = "playlistStatusUpdate"
private const val TRACK_CHANGED = "trackChanged"

@UnstableApi
class AudioPlaylist(
  context: Context,
  appContext: AppContext,
  initialSources: List<AudioSource>,
  updateInterval: Double,
  dataSourceFactory: DataSource.Factory
) : BaseAudioPlayer(
  player = ExoPlayer.Builder(context)
    .setLooper(context.mainLooper)
    .setAudioAttributes(AudioAttributes.DEFAULT, false)
    .setMediaSourceFactory(DefaultMediaSourceFactory(context).setDataSourceFactory(dataSourceFactory))
    .build(),
  appContext = appContext,
  updateInterval = updateInterval,
  statusEventName = PLAYLIST_STATUS_UPDATE
) {
  private var sources: MutableList<AudioSource> = initialSources.toMutableList()
  private var currentRate = 1f
  private var previousMediaItemIndex = 0

  val currentTrackIndex get() = ref.currentMediaItemIndex
  val trackCount get() = ref.mediaItemCount

  private var createMediaItemForSource: ((AudioSource) -> MediaItem?)? = null

  init {
    installPlayerListeners()
    startUpdating()
  }

  fun setMediaItemCreator(creator: (AudioSource) -> MediaItem?) {
    this.createMediaItemForSource = creator
  }

  fun loadInitialPlaylist() {
    val validSources = mutableListOf<AudioSource>()
    sources.forEach { source ->
      createMediaItemForSource?.invoke(source)?.let { mediaItem ->
        validSources.add(source)
        ref.addMediaItem(mediaItem)
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

  fun skipTo(index: Int) {
    if (index !in 0..<trackCount) return
    ref.seekToDefaultPosition(index)
  }

  fun add(source: AudioSource) {
    val mediaItem = createMediaItemForSource?.invoke(source) ?: return
    sources.add(source)
    ref.addMediaItem(mediaItem)
    sendStatusUpdate(mapOf("trackCount" to trackCount))
  }

  fun insert(source: AudioSource, index: Int) {
    if (index !in 0..trackCount) return
    val mediaItem = createMediaItemForSource?.invoke(source) ?: return
    sources.add(index, source)
    ref.addMediaItem(index, mediaItem)
    sendStatusUpdate(mapOf("trackCount" to trackCount))
  }

  fun remove(index: Int) {
    if (index !in 0..<trackCount) return

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

  override fun currentStatus(): Map<String, Any?> {
    val isMuted = ref.volume == 0f
    val isLoaded = ref.playbackState == Player.STATE_READY
    val isBuffering = ref.playbackState == Player.STATE_BUFFERING
    val playingStatus = if (isBuffering) intendedPlayingState else ref.isPlaying

    return mapOf(
      "id" to id,
      "currentIndex" to currentTrackIndex,
      "trackCount" to trackCount,
      "currentTime" to currentTime,
      "duration" to duration,
      "playing" to playingStatus,
      "isBuffering" to isBuffering,
      "isLoaded" to if (ref.playbackState == Player.STATE_ENDED) true else isLoaded,
      "playbackRate" to if (ref.isPlaying) ref.playbackParameters.speed else currentRate,
      "muted" to isMuted,
      "volume" to ref.volume,
      "loop" to loopMode.value,
      "didJustFinish" to false
    )
  }

  private fun emitTrackChanged(previousIndex: Int, currentIndex: Int) {
    emit(
      TRACK_CHANGED,
      mapOf(
        "previousIndex" to previousIndex,
        "currentIndex" to currentIndex
      )
    )
    sendStatusUpdate()
  }
}
