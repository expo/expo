package expo.modules.appmetrics.crashreporting

import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.File

// Robolectric for `android.os.Process.myPid()` in the handler's default pid provider.
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class JvmCrashHandlerTest {
  @get:Rule
  val tmp = TemporaryFolder()

  private var originalHandler: Thread.UncaughtExceptionHandler? = null

  @Before
  fun saveDefaultHandler() {
    originalHandler = Thread.getDefaultUncaughtExceptionHandler()
    JvmCrashHandler.resetForTesting()
  }

  @After
  fun restoreDefaultHandler() {
    Thread.setDefaultUncaughtExceptionHandler(originalHandler)
    JvmCrashHandler.resetForTesting()
  }

  private fun writer(directory: File = tmp.root): CrashFileWriter =
    CrashFileWriter(directory).also { it.prepare() }

  private fun reader(directory: File = tmp.root): CrashFileReader = CrashFileReader(directory)

  private class RecordingHandler : Thread.UncaughtExceptionHandler {
    var receivedThread: Thread? = null
    var receivedThrowable: Throwable? = null

    override fun uncaughtException(thread: Thread, throwable: Throwable) {
      receivedThread = thread
      receivedThrowable = throwable
    }
  }

  @Test
  fun `writes a pending crash file with the current session id`() {
    JvmCrashHandler.currentSessionId = "session-1"
    val writer = writer()
    val handler = JvmCrashHandler(writer, previousHandler = null)

    handler.uncaughtException(Thread.currentThread(), IllegalStateException("boom"))

    val pending = reader().listPendingCrashes().single()
    assertEquals("session-1", pending.sessionId)
    assertEquals("java.lang.IllegalStateException: boom", pending.composedMessage)
  }

  @Test
  fun `records a null session id when the identity is not ready yet`() {
    // `currentSessionId` is left null (reset in @Before) — a crash before the
    // main session exists is captured as an orphan.
    val writer = writer()
    val handler = JvmCrashHandler(writer, previousHandler = null)

    handler.uncaughtException(Thread.currentThread(), IllegalStateException("boom"))

    assertNull(reader().listPendingCrashes().single().sessionId)
  }

  @Test
  fun `always delegates to the previous handler`() {
    val previous = RecordingHandler()
    val handler = JvmCrashHandler(writer(), previous)
    val thread = Thread.currentThread()
    val throwable = IllegalStateException("boom")

    handler.uncaughtException(thread, throwable)

    assertSame(thread, previous.receivedThread)
    assertSame(throwable, previous.receivedThrowable)
  }

  @Test
  fun `delegates even when writing the crash file fails`() {
    // A writer pointed at a file-as-directory fails every write.
    val blocked = tmp.newFile("not-a-directory")
    val previous = RecordingHandler()
    val handler = JvmCrashHandler(CrashFileWriter(blocked), previous)
    val throwable = IllegalStateException("boom")

    handler.uncaughtException(Thread.currentThread(), throwable)

    assertSame(throwable, previous.receivedThrowable)
  }

  @Test
  fun `install chains to whatever handler was registered before`() {
    val previous = RecordingHandler()
    Thread.setDefaultUncaughtExceptionHandler(previous)

    JvmCrashHandler.install(writer())
    val installed = Thread.getDefaultUncaughtExceptionHandler() as JvmCrashHandler
    val throwable = IllegalStateException("boom")
    installed.uncaughtException(Thread.currentThread(), throwable)

    assertSame(throwable, previous.receivedThrowable)
  }

  @Test
  fun `install is idempotent`() {
    // Repeated installs (re-created module, Fast Refresh) must not build a
    // wrapper chain that would record the same crash twice.
    JvmCrashHandler.install(writer())
    val first = Thread.getDefaultUncaughtExceptionHandler()

    JvmCrashHandler.install(writer())

    assertSame(first, Thread.getDefaultUncaughtExceptionHandler())
  }

  @Test
  fun `install stays a no-op after another SDK wraps our handler`() {
    // Sentry-style reporters installed after us hold our handler as their
    // previous one. A later re-install here must not add a second instance in
    // front of them — that would double-record every crash.
    JvmCrashHandler.install(writer())
    val wrappingSdk = RecordingHandler()
    Thread.setDefaultUncaughtExceptionHandler(wrappingSdk)

    JvmCrashHandler.install(writer())

    assertSame(wrappingSdk, Thread.getDefaultUncaughtExceptionHandler())
  }

  @Test
  fun `a crash through a doubly-installed chain writes exactly once`() {
    // Counting write invocations, not files: a doubled chain would write the
    // same pid+millis filename twice and still leave one file behind.
    val writer = io.mockk.spyk(writer())
    Thread.setDefaultUncaughtExceptionHandler(RecordingHandler())
    JvmCrashHandler.install(writer)
    JvmCrashHandler.install(writer)

    val installed = Thread.getDefaultUncaughtExceptionHandler() as JvmCrashHandler
    installed.uncaughtException(Thread.currentThread(), IllegalStateException("boom"))

    io.mockk.verify(exactly = 1) { writer.write(any(), any(), any(), any(), any()) }
  }

  @Test
  fun `does not throw without a previous handler`() {
    val handler = JvmCrashHandler(writer(), previousHandler = null)

    handler.uncaughtException(Thread.currentThread(), IllegalStateException("boom"))

    assertTrue(true)
  }
}
