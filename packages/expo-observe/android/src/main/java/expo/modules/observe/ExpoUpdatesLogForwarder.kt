package expo.modules.observe

import expo.modules.updatesinterface.UpdatesLogEntryListener
import expo.modules.updatesinterface.UpdatesLogEntryListenerRegistry

/**
 * Sends the expo-updates log entries from [UpdatesLogEntryListenerRegistry] to [send] while it is
 * enabled. The expo-updates integration in JS turns it on, so the module listens only while the
 * integration runs.
 */
internal class ExpoUpdatesLogForwarder(private val send: (Map<String, Any>) -> Unit) {
  private val listener = UpdatesLogEntryListener { entry -> send(entry) }

  fun setEnabled(enabled: Boolean) {
    if (enabled) {
      UpdatesLogEntryListenerRegistry.add(listener)
    } else {
      UpdatesLogEntryListenerRegistry.remove(listener)
    }
  }
}
