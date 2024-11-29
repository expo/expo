package expo.modules.updates.events

import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.statemachine.UpdatesStateContext
import java.lang.ref.WeakReference

class UpdatesEventManager(private val logger: UpdatesLogger) : IUpdatesEventManager {
  override var observer: WeakReference<IUpdatesEventManagerObserver>? = null

  override fun sendStateMachineContextEvent(context: UpdatesStateContext) {
    logger.debug("Sending state machine context to observer")

    val observer = observer?.get() ?: run {
      logger.debug("Unable to send state machine context to observer, no observer", UpdatesErrorCode.JSRuntimeError)
      return
    }

    try {
      observer.onStateMachineContextEvent(context)
      logger.debug("Sent state machine context to observer")
    } catch (e: Exception) {
      logger.error(
        "Could not send state machine context to observer",
        e,
        UpdatesErrorCode.JSRuntimeError
      )
    }
  }
}
