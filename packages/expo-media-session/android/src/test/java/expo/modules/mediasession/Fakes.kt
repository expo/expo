package expo.modules.mediasession

import android.media.AudioManager
import expo.modules.kotlin.exception.CodedException

internal class FakeSessionBackend : SessionBackend {
  sealed class Call {
    data class Request(val spec: FocusSpec) : Call()
    object Abandon : Call()
  }

  val calls = mutableListOf<Call>()
  var requestError: Throwable? = null
  var duringAbandon: (() -> Unit)? = null
  var result = FocusResult.GRANTED
  var holdsFocus = false
    private set
  override var onFocusChange: (Int) -> Unit = {}

  val requests: Int
    get() = calls.count { it is Call.Request }

  val abandons: Int
    get() = calls.count { it == Call.Abandon }

  override fun requestFocus(spec: FocusSpec): FocusResult {
    calls.add(Call.Request(spec))
    requestError?.let { throw it }
    holdsFocus = true
    return result
  }

  override fun abandonFocus() {
    calls.add(Call.Abandon)
    holdsFocus = false
    duringAbandon?.invoke()
  }

  fun emitFocusChange(change: Int) {
    if (change == AudioManager.AUDIOFOCUS_LOSS) {
      holdsFocus = false
    }
    onFocusChange(change)
  }
}

internal class RecordingObserver : MediaSessionObserver {
  sealed class Event {
    data class Failed(val client: String) : Event()
    data class Suspended(val reason: String) : Event()
    object Resumed : Event()
    data class InterruptionBegan(val reason: InterruptionReason) : Event()
    data class InterruptionEnded(val shouldResume: Boolean) : Event()
    data class RouteChanged(val reason: RouteChangeReason) : Event()
    data class Ducked(val isDucked: Boolean) : Event()
    data class FocusLost(val transient: Boolean) : Event()
    object ServicesReset : Event()
    data class SilentModeChanged(val isSilent: Boolean) : Event()
    data class NowPlayingOwnerChanged(val id: String?) : Event()
  }

  val events = mutableListOf<Event>()
  var error: CodedException? = null

  override fun mediaSessionDidFail(error: CodedException, client: String) {
    events.add(Event.Failed(client))
    this.error = error
  }

  override fun mediaSessionDidSuspendWrites(reason: String) {
    events.add(Event.Suspended(reason))
  }

  override fun mediaSessionDidResumeWrites() {
    events.add(Event.Resumed)
  }

  override fun mediaSessionInterruptionBegan(reason: InterruptionReason) {
    events.add(Event.InterruptionBegan(reason))
  }

  override fun mediaSessionInterruptionEnded(shouldResume: Boolean) {
    events.add(Event.InterruptionEnded(shouldResume))
  }

  override fun mediaSessionRouteChanged(reason: RouteChangeReason) {
    events.add(Event.RouteChanged(reason))
  }

  override fun mediaSessionDucked(isDucked: Boolean) {
    events.add(Event.Ducked(isDucked))
  }

  override fun mediaSessionFocusLost(transient: Boolean) {
    events.add(Event.FocusLost(transient))
  }

  override fun mediaSessionServicesReset() {
    events.add(Event.ServicesReset)
  }

  override fun mediaSessionSilentModeChanged(isSilent: Boolean) {
    events.add(Event.SilentModeChanged(isSilent))
  }

  override fun mediaSessionNowPlayingOwnerChanged(id: String?) {
    events.add(Event.NowPlayingOwnerChanged(id))
  }
}

internal class FakeNowPlayingCenter : NowPlayingCenterBackend {
  val applied = mutableListOf<NowPlayingCenterState?>()
  private var onCommand: (RemoteCommand) -> Unit = {}
  private var onFailure: (CodedException) -> Unit = {}

  val state: NowPlayingCenterState?
    get() = applied.lastOrNull()

  val targets: Set<RemoteCommandKind>
    get() = state?.commands ?: emptySet()

  override fun setCommandHandler(handler: (RemoteCommand) -> Unit) {
    onCommand = handler
  }

  override fun setFailureHandler(handler: (CodedException) -> Unit) {
    onFailure = handler
  }

  override fun apply(state: NowPlayingCenterState?) {
    applied.add(state)
  }

  fun send(command: RemoteCommand) = onCommand(command)

  fun fail(error: CodedException) = onFailure(error)
}

internal class FakeNowPlayingOwner(
  override val nowPlayingId: String,
  override val mediaType: NowPlayingMediaType = NowPlayingMediaType.AUDIO,
  override var isPlaying: Boolean = true
) : NowPlayingOwner {
  sealed class Event {
    data class Handled(val command: RemoteCommand) : Event()
    object PausedForTakeover : Event()
    object ResumedAfterTakeover : Event()
  }

  val events = mutableListOf<Event>()

  val handledCount: Int
    get() = events.count { it is Event.Handled }

  override fun handle(command: RemoteCommand): Boolean {
    events.add(Event.Handled(command))
    when (command.kind) {
      RemoteCommandKind.PLAY -> isPlaying = true
      RemoteCommandKind.PAUSE -> isPlaying = false
      RemoteCommandKind.TOGGLE_PLAY_PAUSE -> isPlaying = !isPlaying
    }
    return true
  }

  override fun pauseForTakeover() {
    events.add(Event.PausedForTakeover)
    isPlaying = false
  }

  override fun resumeAfterTakeover() {
    events.add(Event.ResumedAfterTakeover)
    isPlaying = true
  }
}
