package expo.modules.appmetrics.crashreporting

import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File

class CrashFileWriterTest {
  @get:Rule
  val tmp = TemporaryFolder()

  private fun writer(directory: File = tmp.root): CrashFileWriter =
    CrashFileWriter(directory).also { it.prepare() }

  private fun throwable(message: String? = "boom"): Throwable = IllegalStateException(message)

  @Test
  fun `writes one parseable file per crash`() {
    val writer = writer()

    val file = writer.write(
      throwable = throwable(),
      threadName = "main",
      sessionId = "session-1",
      pid = 123,
      crashedAtMillis = 1_700_000_000_000
    )

    assertNotNull(file)
    assertTrue(file!!.exists())
    assertTrue(file.name.startsWith("crash-123-1700000000000"))
    assertFalse(file.name.endsWith(".tmp"))
  }

  @Test
  fun `leaves no temp files behind`() {
    val writer = writer()

    writer.write(throwable(), "main", "session-1", 123, 1_700_000_000_000)

    assertTrue(tmp.root.listFiles()!!.none { it.name.endsWith(".tmp") })
  }

  @Test
  fun `prepare creates the directory off the calling thread`() = runTest {
    val dir = File(tmp.root, "crashes")
    val writer = CrashFileWriter(dir, backgroundScope)

    val job = writer.prepare()
    // StandardTestDispatcher defers the launch, so nothing has run yet.
    assertFalse(dir.exists())

    job.join()
    assertTrue(dir.isDirectory)
  }

  @Test
  fun `returns null instead of throwing when the directory is not writable`() {
    // Point the writer at a path occupied by a regular file so every write fails.
    val blocked = tmp.newFile("not-a-directory")
    val writer = CrashFileWriter(blocked)
    writer.prepare()

    val file = writer.write(throwable(), "main", "session-1", 123, 1_700_000_000_000)

    assertNull(file)
  }
}
