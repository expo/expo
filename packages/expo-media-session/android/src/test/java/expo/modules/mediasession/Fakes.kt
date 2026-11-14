package expo.modules.mediasession

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

  val requests: Int
    get() = calls.count { it is Call.Request }

  val abandons: Int
    get() = calls.count { it == Call.Abandon }

  override fun requestFocus(spec: FocusSpec): FocusResult {
    calls.add(Call.Request(spec))
    requestError?.let { throw it }
    return result
  }

  override fun abandonFocus() {
    calls.add(Call.Abandon)
    duringAbandon?.invoke()
  }
}

internal class RecordingObserver : MediaSessionObserver {
  sealed class Event {
    data class Failed(val client: String) : Event()
    data class Suspended(val reason: String) : Event()
    object Resumed : Event()
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
}
