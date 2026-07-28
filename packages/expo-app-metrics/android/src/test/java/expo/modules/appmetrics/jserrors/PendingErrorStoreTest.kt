package expo.modules.appmetrics.jserrors

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import java.io.File
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class PendingErrorStoreTest {
  private val context: Context = ApplicationProvider.getApplicationContext()
  private val directory = File(context.noBackupFilesDir, "ExpoAppMetrics/pending-errors")

  @After
  fun cleanup() {
    directory.deleteRecursively()
  }

  @Test
  fun `writes and drains a fatal error round-trip`() {
    PendingErrorStore.write(context, makePendingError(message = "boom", sessionId = "session-1"))

    val drained = PendingErrorStore.drain(context)
    assertEquals(1, drained.size)
    assertEquals("boom", drained[0].message)
    assertEquals("session-1", drained[0].sessionId)
    assertEquals("global", drained[0].source)
  }

  @Test
  fun `drain removes the files so a second drain is empty`() {
    PendingErrorStore.write(context, makePendingError(message = "once", sessionId = "s"))
    assertEquals(1, PendingErrorStore.drain(context).size)
    assertTrue(PendingErrorStore.drain(context).isEmpty())
  }

  @Test
  fun `drains multiple errors oldest-first by timestamp`() {
    PendingErrorStore.write(context, makePendingError(message = "first", sessionId = "s", timestamp = "2026-01-01T00:00:01Z"))
    PendingErrorStore.write(context, makePendingError(message = "second", sessionId = "s", timestamp = "2026-01-01T00:00:02Z"))

    val drained = PendingErrorStore.drain(context)
    assertEquals(listOf("first", "second"), drained.map { it.message })
  }

  @Test
  fun `skips and deletes a corrupt file`() {
    PendingErrorStore.write(context, makePendingError(message = "valid", sessionId = "s"))
    val corrupt = File(directory, "2026-01-01T00:00:00Z-corrupt.json")
    corrupt.writeText("not json")

    val drained = PendingErrorStore.drain(context)
    assertEquals(listOf("valid"), drained.map { it.message })
    assertFalse(corrupt.exists())
  }

  private fun makePendingError(
    message: String,
    sessionId: String,
    timestamp: String = "2026-01-01T00:00:00Z"
  ) = PendingErrorStore.PendingError(
    source = "global",
    type = "Error",
    message = message,
    stacktrace = "at f (app.js:1:1)",
    sessionId = sessionId,
    timestamp = timestamp
  )
}
