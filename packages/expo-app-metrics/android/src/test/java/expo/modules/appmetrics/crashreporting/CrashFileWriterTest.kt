package expo.modules.appmetrics.crashreporting

import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.File

// Robolectric for the real `android.util.AtomicFile` the writer commits through.
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class CrashFileWriterTest {
  @get:Rule
  val tmp = TemporaryFolder()

  private fun writer(directory: File = tmp.root): CrashFileWriter =
    CrashFileWriter(directory)

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
    assertTrue(file.name.endsWith(".json"))
  }

  @Test
  fun `leaves no temp files behind`() {
    val writer = writer()

    writer.write(throwable(), "main", "session-1", 123, 1_700_000_000_000)

    // No `AtomicFile` staging artifacts survive a committed write.
    assertTrue(tmp.root.listFiles()!!.none { it.name.endsWith(".new") || it.name.endsWith(".bak") })
  }

  @Test
  fun `returns null instead of throwing when the directory is not writable`() {
    // Point the writer at a path occupied by a regular file so every write fails.
    val blocked = tmp.newFile("not-a-directory")
    val writer = CrashFileWriter(blocked)

    val file = writer.write(throwable(), "main", "session-1", 123, 1_700_000_000_000)

    assertNull(file)
  }
}
