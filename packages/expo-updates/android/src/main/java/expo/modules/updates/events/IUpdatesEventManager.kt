package expo.modules.updates.events

import expo.modules.updates.statemachine.UpdatesStateContext
import java.lang.ref.WeakReference

interface IUpdatesEventManagerObserver {
  fun onStateMachineContextEvent(context: UpdatesStateContext)
}

interface IUpdatesEventManager {
  var observer: WeakReference<IUpdatesEventManagerObserver>?
  fun sendStateMachineContextEvent(context: UpdatesStateContext)
}
