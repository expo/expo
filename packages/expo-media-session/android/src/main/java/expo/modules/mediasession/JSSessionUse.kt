package expo.modules.mediasession

import expo.modules.kotlin.exception.CodedException
import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoSharedObject
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.SharedObject
import java.util.concurrent.Executor
import java.util.concurrent.atomic.AtomicBoolean

@ExpoSharedObject(name = "SessionUse")
internal class JSSessionUse(
  manager: MediaSessionManaging,
  client: String,
  requirements: SessionRequirements,
  executor: Executor = MainThreadExecutor
) : SharedObject(), SessionUseDelegate {
  private val ended = AtomicBoolean(false)

  @Event(name = "pause")
  private val onPause = event<SessionPauseEvent>()

  @Event(name = "resume")
  private val onResume = event<Unit>()

  @Event(name = "duck")
  private val onDuck = event<SessionDuckEvent>()

  @Event(name = "fail")
  private val onFail = event<SessionFailEvent>()

  @Event(name = "ended")
  private val onEnd = event<Unit>()

  private val use = manager.beginUse(client, requirements, this, executor)

  @JS
  fun update(requirements: SessionRequirementsRecord) {
    use.update(requirements.toRequirements())
  }

  @JS
  fun end() {
    if (ended.compareAndSet(false, true)) {
      use.end()
    }
  }

  override fun sharedObjectDidRelease() {
    end()
    super.sharedObjectDidRelease()
  }

  override fun sessionUsePause(use: SessionUse, reason: SessionPauseReason) {
    if (!ended.get()) {
      onPause(SessionPauseEvent(reason.raw))
    }
  }

  override fun sessionUseResume(use: SessionUse) {
    if (!ended.get()) {
      onResume(Unit)
    }
  }

  override fun sessionUseDuck(use: SessionUse, isDucked: Boolean) {
    if (!ended.get()) {
      onDuck(SessionDuckEvent(isDucked))
    }
  }

  override fun sessionUseDidFail(use: SessionUse, error: CodedException) {
    if (!ended.get()) {
      val description = error.message ?: "The session use failed for an unknown reason. Check Logcat for the error"
      val message = error.cause?.message?.let { "$description\n→ Caused by: $it" } ?: description
      onFail(SessionFailEvent(message))
    }
  }

  override fun sessionUseDidEnd(use: SessionUse) {
    if (ended.compareAndSet(false, true)) {
      onEnd(Unit)
    }
  }
}
