package expo.modules.updates.logging

import expo.modules.updatesinterface.UpdatesLogEntryListener
import expo.modules.updatesinterface.UpdatesLogEntryListenerRegistry
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.util.Collections
import java.util.Date
import java.util.UUID

@RunWith(RobolectricTestRunner::class)
class UpdatesLogEntryListenerTest {
  @get:Rule
  val temporaryFolder = TemporaryFolder()

  private lateinit var logger: UpdatesLogger
  private val marker = UUID.randomUUID().toString()
  private val received: MutableList<Map<String, Any>> = Collections.synchronizedList(mutableListOf())
  private val listener = UpdatesLogEntryListener { entry -> received.add(entry) }

  private fun receivedWithMarker(): List<Map<String, Any>> =
    synchronized(received) { received.filter { (it["message"] as? String)?.contains(marker) == true } }

  @Before
  fun setUp() {
    logger = UpdatesLogger(temporaryFolder.newFolder())
    UpdatesLogEntryListenerRegistry.add(listener)
  }

  @After
  fun tearDown() {
    UpdatesLogEntryListenerRegistry.remove(listener)
  }

  @Test
  fun `a logged warning reaches a listener with its fields`() {
    val before = Date().time
    logger.warn("Warning $marker", UpdatesErrorCode.AssetsFailedToLoad, "update-1", "asset-1")
    val after = Date().time

    val entries = receivedWithMarker()
    assertEquals(1, entries.size)
    val entry = entries.first()
    assertEquals("Warning $marker", entry["message"])
    assertEquals("AssetsFailedToLoad", entry["code"])
    assertEquals("warn", entry["level"])
    assertEquals("update-1", entry["updateId"])
    assertEquals("asset-1", entry["assetId"])
    val timestamp = entry["timestamp"] as Long
    assertTrue(timestamp in before..after)
  }

  @Test
  fun `errors reach a listener and entries below the warning level do not`() {
    logger.info("Info $marker")
    logger.debug("Debug $marker")
    logger.error("Error $marker", Exception("cause"), UpdatesErrorCode.UpdateFailedToLoad)

    assertEquals(listOf("error"), receivedWithMarker().map { it["level"] })
  }

  @Test
  fun `a removed listener gets no entries`() {
    UpdatesLogEntryListenerRegistry.remove(listener)

    logger.warn("Warning $marker", UpdatesErrorCode.None)

    assertTrue(receivedWithMarker().isEmpty())
  }

  @Test
  fun `a listener that throws does not stop logging or other listeners`() {
    val throwingListener = UpdatesLogEntryListener { throw IllegalStateException("listener failed") }
    UpdatesLogEntryListenerRegistry.remove(listener)
    UpdatesLogEntryListenerRegistry.add(throwingListener)
    UpdatesLogEntryListenerRegistry.add(listener)
    try {
      logger.warn("Warning $marker", UpdatesErrorCode.None)
    } finally {
      UpdatesLogEntryListenerRegistry.remove(throwingListener)
    }

    assertEquals(1, receivedWithMarker().size)
  }

  @Test
  fun `entries logged from several threads all reach a listener`() {
    val threads = (0 until 20).map { index ->
      Thread { logger.warn("Warning $marker $index", UpdatesErrorCode.None) }
    }
    threads.forEach { it.start() }
    threads.forEach { it.join() }

    assertEquals(20, receivedWithMarker().size)
  }
}
