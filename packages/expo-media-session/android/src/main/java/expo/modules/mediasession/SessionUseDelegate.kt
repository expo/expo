package expo.modules.mediasession

import expo.modules.kotlin.exception.CodedException

@JvmInline
value class SessionPauseReason private constructor(val raw: String) {
  companion object {
    val INTERRUPTION = SessionPauseReason("interruption")
    val BACKGROUND = SessionPauseReason("background")
    val OUTPUT_DISCONNECTED = SessionPauseReason("outputDisconnected")
    val FOCUS_LOST = SessionPauseReason("focusLost")
  }
}

/** Called on the executor passed to beginUse, never after end() returns on that executor. The module holds the delegate weakly. */
interface SessionUseDelegate {
  fun sessionUsePause(use: SessionUse, reason: SessionPauseReason)

  fun sessionUseResume(use: SessionUse)

  fun sessionUseDuck(use: SessionUse, isDucked: Boolean)

  fun sessionUseDidFail(use: SessionUse, error: CodedException)

  fun sessionUseDidEnd(use: SessionUse)
}
