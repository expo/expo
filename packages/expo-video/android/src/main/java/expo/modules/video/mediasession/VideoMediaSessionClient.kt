package expo.modules.video.mediasession

import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.common.util.Util
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.mediasession.InterruptionReason
import expo.modules.mediasession.MediaPlayerOwner
import expo.modules.mediasession.MediaSessionManager
import expo.modules.mediasession.MediaSessionObserver
import expo.modules.mediasession.NowPlayingClaim
import expo.modules.mediasession.NowPlayingInfo
import expo.modules.mediasession.NowPlayingMediaType
import expo.modules.mediasession.ObserverRegistration
import expo.modules.mediasession.RemoteCommand
import expo.modules.mediasession.RemoteCommandKind
import expo.modules.mediasession.SessionRequirements
import expo.modules.mediasession.SessionUse
import expo.modules.video.enums.AudioMixingMode
import expo.modules.video.listeners.VideoPlayerListener
import expo.modules.video.managers.VideoManager
import expo.modules.video.player.VideoPlayer
import expo.modules.video.records.AudioTrack
import expo.modules.video.records.SubtitleTrack
import expo.modules.video.records.VideoSource
import expo.modules.video.records.VideoTrack
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference

/**
 * Requests audio focus and the Now Playing notification for one player from `expo-media-session`.
 * `expo-video` must not request audio focus or create a media session directly. Only this class calls [MediaSessionManager].
 */
@UnstableApi
internal class VideoMediaSessionClient(
  player: VideoPlayer,
  appContext: AppContext,
  private val manager: MediaSessionManager
) : VideoPlayerListener, MediaSessionObserver, MediaPlayerOwner, AutoCloseable {
  private val videoPlayer = WeakReference(player)
  private val appContext = WeakReference(appContext)

  // The owner must give the module the same player for the life of the claim.
  override val player: Player = player.player
  override val mediaType = NowPlayingMediaType.VIDEO

  @Volatile
  override var isPlaying = false
    private set

  // Calls to the manager are made while this lock is held, so they stay in the order of the state changes.
  private val lock = Any()
  private var state = VideoSessionState()
  private var use: SessionUse? = null
  private var appliedRequirements: SessionRequirements? = null
  private var isUseStale = false
  private var claim: NowPlayingClaim? = null
  private var info = VideoNowPlaying.info()
  private var published: Pair<NowPlayingInfo, Boolean>? = null
  private var reportedConflicts = emptyList<VideoSessionConflict>()

  @Volatile
  private var isClosed = false
  private var registration: ObserverRegistration? = null

  private val duckedVolume = DuckedVolume()

  /**
   * Starts to listen to the module. Call it when the [VideoPlayer] is fully constructed,
   * because the callbacks read its properties.
   */
  fun start() {
    registration = manager.addObserver(this)
  }

  fun update(change: (VideoSessionState) -> VideoSessionState) = update(newInfo = null, change)

  private fun update(newInfo: NowPlayingInfo?, change: (VideoSessionState) -> VideoSessionState) {
    val warnings = synchronized(lock) {
      if (isClosed) {
        return
      }
      newInfo?.let {
        info = it
      }
      state = change(state)
      isPlaying = state.isPlaying
      reconcile()
      newWarnings()
    }
    warnings.forEach {
      appContext.get()?.jsLogger?.warn(it)
    }
  }

  // Call this while `lock` is held. A call after `close()` would add the released player to `VideoManager` again.
  private fun newWarnings(): List<String> {
    val conflicts = sessionConflicts(state)
    val warnings = (conflicts - reportedConflicts.toSet()).map { it.message }.toMutableList()
    reportedConflicts = conflicts

    if (VideoManager.updateSessionManagement(this, state)) {
      warnings.add(SESSION_MANAGEMENT_MIX_WARNING)
    }
    return warnings
  }

  override fun close() {
    synchronized(lock) {
      if (isClosed) {
        return
      }
      isClosed = true
      VideoManager.removeSessionManagement(this)
      withdrawClaim()
      endUse()
    }
    registration?.remove()
  }

  private fun reconcile() {
    val claimAction = nowPlayingClaimAction(claim != null, state)

    if (claimAction == NowPlayingClaimAction.WITHDRAW) {
      withdrawClaim()
    }

    val action = sessionUseAction(use != null, isUseStale, appliedRequirements, state)

    when (action) {
      SessionUseAction.None -> Unit
      is SessionUseAction.Begin -> beginUse(action.requirements)
      is SessionUseAction.Update -> {
        use?.update(action.requirements)
        appliedRequirements = action.requirements
      }
      is SessionUseAction.Restart -> {
        endUse()
        beginUse(action.requirements)
      }
      SessionUseAction.End -> endUse()
    }

    // The module learns that the owner started to play or paused only from an update of the claim.
    // Each update makes the module post the notification again, so skip the updates that change nothing.
    val current = info to state.isPlaying

    when (claimAction) {
      NowPlayingClaimAction.OFFER -> claim = manager.offerNowPlaying(this, info, VideoNowPlaying.commands)
      NowPlayingClaimAction.NONE -> if (current != published) {
        claim?.update(info)
      }
      NowPlayingClaimAction.WITHDRAW -> Unit
    }
    published = current
  }

  private fun withdrawClaim() {
    claim?.close()
    claim = null
  }

  private fun setInfo(source: VideoSource?, isLive: Boolean, change: (VideoSessionState) -> VideoSessionState = { it }) {
    val metadata = source?.metadata
    val newInfo = VideoNowPlaying.info(
      title = metadata?.title,
      artist = metadata?.artist,
      artworkUrl = metadata?.artwork?.toString(),
      isLive = isLive
    )
    update(newInfo, change)
  }

  private fun beginUse(requirements: SessionRequirements) {
    use = manager.beginUse(CLIENT_NAME, requirements)
    appliedRequirements = requirements
    isUseStale = false
  }

  private fun endUse() {
    use?.close()
    use = null
    appliedRequirements = null
    isUseStale = false
  }

  private fun onMain(block: (VideoPlayer) -> Unit) {
    appContext.get()?.mainQueue?.launch {
      videoPlayer.get()?.let(block)
    }
  }

  private fun pauseIfNotMuted() = onMain { player ->
    if (!player.muted) {
      player.player.pause()
    }
  }

  // VideoPlayerListener

  // `onIsPlayingChanged` reports `false` while the player buffers, and a use that ends for a stall
  // lets other apps resume their audio after 1 second.
  override fun onPlaybackRequestedChanged(player: VideoPlayer, isPlaybackRequested: Boolean, oldIsPlaybackRequested: Boolean?) {
    update { it.withPlaying(isPlaybackRequested) }
  }

  override fun onVolumeChanged(player: VideoPlayer, volume: Float, oldVolume: Float?) {
    update { it.copy(volume = volume) }
  }

  override fun onMutedChanged(player: VideoPlayer, muted: Boolean, oldMuted: Boolean?) {
    update { it.copy(isMuted = muted) }
  }

  override fun onAudioMixingModeChanged(player: VideoPlayer, audioMixingMode: AudioMixingMode, oldAudioMixingMode: AudioMixingMode?) {
    update { it.copy(audioMixingMode = audioMixingMode) }
  }

  override fun onSourceChanged(player: VideoPlayer, source: VideoSource?, oldSource: VideoSource?) {
    setInfo(source, isLive = false) { it.copy(hasSource = source != null) }
  }

  override fun onVideoSourceLoaded(
    player: VideoPlayer,
    videoSource: VideoSource?,
    duration: Double?,
    availableVideoTracks: List<VideoTrack>,
    availableSubtitleTracks: List<SubtitleTrack>,
    availableAudioTracks: List<AudioTrack>
  ) {
    setInfo(videoSource, player.isLive)
  }

  // NowPlayingOwner. Called on the coordinator thread.

  override fun handle(command: RemoteCommand) = onMain { _ ->
    if (isClosed) {
      return@onMain
    }
    when (command.kind) {
      // A plain `play()` does nothing for a player that ended or that is idle.
      RemoteCommandKind.PLAY -> Util.handlePlayButtonAction(player)
      RemoteCommandKind.PAUSE -> player.pause()
      RemoteCommandKind.TOGGLE_PLAY_PAUSE -> Util.handlePlayPauseButtonAction(player)
      else -> VideoNowPlaying.seekTargetMs(command, player.currentPosition)?.let(player::seekTo)
    }
  }

  override fun pauseForTakeover() {
    update { it.copy(isPausedForTakeover = true) }
    handle(RemoteCommand(RemoteCommandKind.PAUSE))
  }

  override fun resumeAfterTakeover() {
    val isPausedForTakeover = synchronized(lock) { state.isPausedForTakeover }

    if (isPausedForTakeover) {
      handle(RemoteCommand(RemoteCommandKind.PLAY))
    }
  }

  /**
   * The module cannot see a pause of a player that it already paused for a takeover.
   * Without this, it resumes a player that the app paused itself.
   */
  fun onPauseRequested() {
    update { it.copy(isPausedForTakeover = false) }
  }

  // MediaSessionObserver. The module sends an interruption and a focus loss for one loss of audio focus,
  // and every observer gets both, so these reactions must be safe to run twice.

  override fun mediaSessionInterruptionBegan(reason: InterruptionReason) {
    pauseIfNotMuted()
  }

  override fun mediaSessionFocusLost(transient: Boolean) {
    if (!transient) {
      synchronized(lock) {
        isUseStale = use != null
      }
    }
    pauseIfNotMuted()
  }

  override fun mediaSessionDucked(isDucked: Boolean) = onMain { player ->
    val volume = if (isDucked) {
      duckedVolume.duck(player.volume)
    } else {
      duckedVolume.restore()
    }
    volume?.let {
      player.volume = it
    }
  }

  override fun mediaSessionDidFail(error: CodedException, client: String) {
    val (hasUse, hasClaim) = synchronized(lock) { Pair(use != null, claim != null) }
    val logger = appContext.get()?.jsLogger

    // Every observer gets the failures of all clients of the module.
    if (client == CLIENT_NAME && hasUse) {
      logger?.warn("[expo-video] Failed to get audio focus. This might cause issues with audio playback. ${error.message}")
    } else if (client == NOW_PLAYING_CLIENT_NAME && hasClaim) {
      logger?.warn(
        "[expo-video] The Now Playing notification or the media playback service failed. " +
          "If background playback does not work, set `supportsBackgroundPlayback` in the expo-video config plugin. ${error.message}"
      )
    }
  }

  companion object {
    const val CLIENT_NAME = "expo-video"

    // The module reports the failures of its media playback service with this client name.
    private const val NOW_PLAYING_CLIENT_NAME = "Now Playing"
  }
}
