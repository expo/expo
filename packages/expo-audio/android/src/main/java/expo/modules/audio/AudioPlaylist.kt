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
import expo.modules.kotlin.sharedobjects.SharedRef
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.launch
import java.util.UUID

private const val PLAYLIST_STATUS_UPDATE = "playlistStatusUpdate"
private const val TRACK_CHANGED = "trackChanged"

@UnstableApi
class AudioPlaylist(
  context: Context,
  appContext: AppContext,
  initialSources: List<AudioSource>,
  private val updateInterval: Double,
  dataSourceFactory: DataSource.Factory
) : SharedRef<ExoPlayer>(
  ExoPlayer.Builder(context)
    .setLooper(context.mainLooper)
    .setAudioAttributes(AudioAttributes.DEFAULT, false)
    .setMediaSourceFactory(DefaultMediaSourceFactory(context).setDataSourceFactory(dataSourceFactory))
    .build(),
  appContext
),
  Playable {
  override val id: String = UUID.randomUUID().toString()

  private var sources: MutableList<AudioSource> = initialSources.toMutableList()

  override var isPaused = false
  override var isMuted = false
  override var previousVolume = 1f
  override var onPlaybackStateChange: ((Boolean) -> Unit)? = null

  private var playerScope = CoroutineScope(Dispatchers.Main)
  private var playerListener: Player.Listener? = null
  private var playing = false
  private var updateJob: Job? = null
  private var previousPlaybackState = Player.STATE_IDLE
  private var intendedPlayingState = false
  private var currentRate = 1f
  private var previousMediaItemIndex = 0

  val currentTrackIndex get() = ref.currentMediaItemIndex
  override val player get() = ref
  val trackCount get() = ref.mediaItemCount

  private var createMediaItemForSource: ((AudioSource) -> MediaItem?)? = null

  init {
    addPlayerListeners()
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
      playerScope.launch {
        sendStatusUpdate(mapOf("loop" to value.value))
      }
    }

  fun getSources(): List<AudioSource> {
    return sources.toList()
  }

  private fun addPlayerListeners() {
    val listener = object : Player.Listener {
      override fun onIsPlayingChanged(isPlaying: Boolean) {
        playing = isPlaying
        onPlaybackStateChange?.invoke(isPlaying)

        val isTransient = !isPlaying &&
          (ref.playbackState == Player.STATE_ENDED || ref.playbackState == Player.STATE_BUFFERING)
        if (!isTransient) {
          intendedPlayingState = isPlaying
        }

        if (isTransient) {
          return
        }
        playerScope.launch {
          sendStatusUpdate(mapOf("playing" to isPlaying))
        }
      }

      override fun onIsLoadingChanged(isLoading: Boolean) {
        playerScope.launch {
          sendStatusUpdate(mapOf("isLoaded" to (ref.playbackState == Player.STATE_READY)))
        }
      }

      override fun onPlaybackStateChanged(playbackState: Int) {
        val justFinished = playbackState == Player.STATE_ENDED &&
          previousPlaybackState != Player.STATE_ENDED
        previousPlaybackState = playbackState

        if (justFinished) {
          intendedPlayingState = false
        }

        playerScope.launch {
          val updateMap = mutableMapOf<String, Any?>()
          if (justFinished) {
            updateMap["didJustFinish"] = true
            updateMap["playing"] = false
          }
          sendStatusUpdate(updateMap)
        }
      }

      override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
        val currentIndex = ref.currentMediaItemIndex
        if (currentIndex != previousMediaItemIndex) {
          emitTrackChanged(previousMediaItemIndex, currentIndex)
          previousMediaItemIndex = currentIndex
        }
        playerScope.launch {
          sendStatusUpdate()
        }
      }

      override fun onPositionDiscontinuity(
        oldPosition: Player.PositionInfo,
        newPosition: Player.PositionInfo,
        reason: Int
      ) {
        if (reason == Player.DISCONTINUITY_REASON_SEEK) {
          playerScope.launch {
            sendStatusUpdate(mapOf("currentTime" to (newPosition.positionMs / 1000.0)))
          }
        }
      }

      override fun onPlayerError(error: PlaybackException) {
        playerScope.launch {
          sendStatusUpdate(
            mapOf(
              "error" to mapOf(
                "message" to error.message,
                "code" to error.errorCode
              )
            )
          )
        }
      }
    }
    playerListener = listener
    ref.addListener(listener)
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
    val count = trackCount
    playerScope.launch {
      sendStatusUpdate(mapOf("trackCount" to count))
    }
  }

  fun insert(source: AudioSource, index: Int) {
    if (index !in 0..trackCount) return
    val mediaItem = createMediaItemForSource?.invoke(source) ?: return
    sources.add(index, source)
    ref.addMediaItem(index, mediaItem)
    val count = trackCount
    playerScope.launch {
      sendStatusUpdate(mapOf("trackCount" to count))
    }
  }

  fun remove(index: Int) {
    if (index !in 0..<trackCount) return

    sources.removeAt(index)
    ref.removeMediaItem(index)

    val count = trackCount
    playerScope.launch {
      sendStatusUpdate(mapOf("trackCount" to count))
    }
  }

  fun clear() {
    ref.pause()
    ref.clearMediaItems()
    sources.clear()

    playerScope.launch {
      sendStatusUpdate(
        mapOf(
          "trackCount" to 0,
          "currentIndex" to 0,
          "playing" to false
        )
      )
    }
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

  private fun startUpdating() {
    updateJob?.cancel()
    updateJob = flow {
      while (true) {
        emit(Unit)
        delay(updateInterval.toLong())
      }
    }
      .onStart {
        sendStatusUpdate()
      }
      .onEach {
        if (playing) {
          sendStatusUpdate()
        }
      }
      .launchIn(playerScope)
  }

  private fun sendStatusUpdate(map: Map<String, Any?>? = null) {
    val data = currentStatus()
    val body = map?.let { data + it } ?: data
    emit(PLAYLIST_STATUS_UPDATE, body)
  }

  private fun emitTrackChanged(previousIndex: Int, currentIndex: Int) {
    emit(
      TRACK_CHANGED,
      mapOf(
        "previousIndex" to previousIndex,
        "currentIndex" to currentIndex
      )
    )
    playerScope.launch {
      sendStatusUpdate()
    }
  }

  private fun release() {
    playerListener?.let { ref.removeListener(it) }
    playerScope.cancel()
    ref.release()
  }

  override fun sharedObjectDidRelease() {
    super.sharedObjectDidRelease()
    // Run on GlobalScope (not appContext.mainQueue) so that reloading doesn't cancel the release process
    GlobalScope.launch(Dispatchers.Main) {
      release()
    }
  }
}
