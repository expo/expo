package expo.modules.updates.logging

import expo.modules.updatesinterface.UpdatesLogEntryListener
import expo.modules.updatesinterface.UpdatesLogEntryListenerRegistry

/**
 * Sends the log entries from [UpdatesLogEntryListenerRegistry] to [send] while it is enabled.
 * `UpdatesModule` enables it while JS listens for log entries.
 */
internal class UpdatesLogEntryForwarder(private val send: (Map<String, Any>) -> Unit) {
  private val listener = UpdatesLogEntryListener { entry -> send(entry) }

  fun setEnabled(enabled: Boolean) {
    if (enabled) {
      UpdatesLogEntryListenerRegistry.add(listener)
    } else {
      UpdatesLogEntryListenerRegistry.remove(listener)
    }
  }
}
