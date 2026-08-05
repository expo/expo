package expo.modules.audio

import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedRef
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.onStart
import java.util.UUID

/**
 * Base class for audio playback objects.
 * Provides periodic status updates, player listener installation with customizable hooks,
 * and shared state tracking for buffering/transient states.
 *
 * Subclasses must call [installPlayerListeners] and [startUpdating] from their init blocks.
 */
@UnstableApi
abstract class BaseAudioPlayer(
  player: ExoPlayer,
  appContext: AppContext,
  private val updateInterval: Double,
  private val statusEventName: String
) : SharedRef<ExoPlayer>(player, appContext), Playable {
  override val id: String = UUID.randomUUID().toString()
  override var isPaused = false
  override var isMuted = false
  override var previousVolume = 1f
  override var onPlaybackStateChange: ((Boolean) -> Unit)? = null
  override val player get() = ref

  protected var playerScope = CoroutineScope(Dispatchers.Main)
  protected var playerListener: Player.Listener? = null
  protected var previousPlaybackState = Player.STATE_IDLE
  protected var intendedPlayingState = false
  private var playing = false
  private var updateJob: Job? = null

  protected fun startUpdating() {
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

  protected fun sendStatusUpdate(map: Map<String, Any?>? = null) {
    val data = currentStatus()
    val body = map?.let { data + it } ?: data
    emit(statusEventName, body)
  }

  protected fun installPlayerListeners() {
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
        sendStatusUpdate(mapOf("playing" to isPlaying))
      }

      override fun onIsLoadingChanged(isLoading: Boolean) {
        this@BaseAudioPlayer.onLoadingChanged(isLoading)
      }

      override fun onPlaybackStateChanged(playbackState: Int) {
        val justFinished = playbackState == Player.STATE_ENDED &&
          previousPlaybackState != Player.STATE_ENDED
        previousPlaybackState = playbackState

        if (justFinished) {
          intendedPlayingState = false
        }
        this@BaseAudioPlayer.onPlaybackStateUpdated(playbackState, justFinished)
      }

      override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
        this@BaseAudioPlayer.onMediaItemChanged(mediaItem, reason)
      }

      override fun onPositionDiscontinuity(
        oldPosition: Player.PositionInfo,
        newPosition: Player.PositionInfo,
        reason: Int
      ) {
        if (reason == Player.DISCONTINUITY_REASON_SEEK) {
          sendStatusUpdate(mapOf("currentTime" to (newPosition.positionMs / 1000.0)))
        }
      }

      override fun onPlayerError(error: PlaybackException) {
        this@BaseAudioPlayer.onPlayerError(error)
      }
    }
    playerListener = listener
    ref.addListener(listener)
  }

  protected open fun onLoadingChanged(isLoading: Boolean) {
    sendStatusUpdate()
  }

  protected open fun onPlaybackStateUpdated(playbackState: Int, justFinished: Boolean) {
    val updateMap = mutableMapOf<String, Any?>()
    if (justFinished) {
      updateMap["didJustFinish"] = true
      updateMap["playing"] = false
    }
    sendStatusUpdate(updateMap)
  }

  protected open fun onMediaItemChanged(mediaItem: MediaItem?, reason: Int) {
    sendStatusUpdate()
  }

  protected open fun onPlayerError(error: PlaybackException) {
    // Override in subclasses to handle errors.
  }

  @OptIn(DelicateCoroutinesApi::class)
  override fun sharedObjectDidRelease() {
    super.sharedObjectDidRelease()
    // Run on GlobalScope (not appContext.mainQueue) so that reloading doesn't cancel the release process
    GlobalScope.launch(Dispatchers.Main) {
      releasePlayer()
    }
  }

  protected open fun releasePlayer() {
    playerListener?.let { ref.removeListener(it) }
    playerScope.cancel()
    ref.release()
  }
}
