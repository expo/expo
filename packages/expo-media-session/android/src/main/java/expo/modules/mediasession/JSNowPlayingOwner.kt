package expo.modules.mediasession

import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoSharedObject
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.SharedObject

@ExpoSharedObject(name = "NowPlayingOwner")
internal class JSNowPlayingOwner(
  private val manager: MediaSessionManager,
  override val mediaType: NowPlayingMediaType
) : SharedObject(), NowPlayingOwner {
  @Volatile
  override var isPlaying: Boolean = false
    private set

  private var claim: NowPlayingClaim? = null

  @Event(name = "command")
  private val onCommand = event<RemoteCommandEvent>()

  @Event(name = "pauseForTakeover")
  private val onPauseForTakeover = event<Unit>()

  @Event(name = "resumeAfterTakeover")
  private val onResumeAfterTakeover = event<Unit>()

  @JS
  fun offer(info: NowPlayingInfoRecord, commands: List<String>, isPlaying: Boolean) {
    this.isPlaying = isPlaying
    val offered = manager.offerNowPlaying(this, info.toInfo(), commandKinds(commands))
    val previous = synchronized(this) { claim.also { claim = offered } }
    previous?.withdraw()
  }

  @JS
  fun update(info: NowPlayingInfoRecord, commands: List<String>?, isPlaying: Boolean) {
    this.isPlaying = isPlaying
    synchronized(this) { claim }?.update(info.toInfo(), commands?.let(::commandKinds))
  }

  @JS
  fun withdraw() {
    synchronized(this) { claim.also { claim = null } }?.withdraw()
  }

  override fun handle(command: RemoteCommand) {
    onCommand(RemoteCommandEvent(command.kind.raw, command.value))
  }

  override fun pauseForTakeover() {
    onPauseForTakeover(Unit)
  }

  override fun resumeAfterTakeover() {
    onResumeAfterTakeover(Unit)
  }

  override fun sharedObjectDidRelease() {
    withdraw()
    super.sharedObjectDidRelease()
  }

  private companion object {
    val knownCommandKinds = listOf(
      RemoteCommandKind.PLAY,
      RemoteCommandKind.PAUSE,
      RemoteCommandKind.TOGGLE_PLAY_PAUSE,
      RemoteCommandKind.SEEK,
      RemoteCommandKind.SKIP_FORWARD,
      RemoteCommandKind.SKIP_BACKWARD,
      RemoteCommandKind.NEXT_TRACK,
      RemoteCommandKind.PREVIOUS_TRACK
    ).associateBy { it.raw }

    fun commandKinds(raw: List<String>) = raw.mapNotNull { knownCommandKinds[it] }.toSet()
  }
}
