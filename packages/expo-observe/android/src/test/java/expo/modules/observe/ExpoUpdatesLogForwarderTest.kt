package expo.modules.observe

import expo.modules.updatesinterface.UpdatesLogEntryListenerRegistry
import org.junit.Assert.assertEquals
import org.junit.Test
import java.util.Collections
import java.util.UUID

class ExpoUpdatesLogForwarderTest {
  private val marker = UUID.randomUUID().toString()

  @Test
  fun `sends registry entries only while it is enabled`() {
    val sent: MutableList<Map<String, Any>> = Collections.synchronizedList(mutableListOf())
    val forwarder = ExpoUpdatesLogForwarder { entry -> sent.add(entry) }

    UpdatesLogEntryListenerRegistry.notify(mapOf("message" to "before $marker"))
    forwarder.setEnabled(true)
    UpdatesLogEntryListenerRegistry.notify(mapOf("message" to "enabled $marker"))
    forwarder.setEnabled(false)
    UpdatesLogEntryListenerRegistry.notify(mapOf("message" to "after $marker"))

    val messages = synchronized(sent) { sent.map { it["message"] as String }.filter { it.contains(marker) } }
    assertEquals(listOf("enabled $marker"), messages)
  }
}
