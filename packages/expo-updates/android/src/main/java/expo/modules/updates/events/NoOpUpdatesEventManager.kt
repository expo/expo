package expo.modules.updates.events

import expo.modules.updates.statemachine.UpdatesStateContext
import java.lang.ref.WeakReference

class NoOpUpdatesEventManager : IUpdatesEventManager {
  override var observer: WeakReference<IUpdatesEventManagerObserver>? = null
  override fun sendStateMachineContextEvent(context: UpdatesStateContext) {}
}
