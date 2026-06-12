package expo.modules.appmetrics.crashreporting

import android.os.Process

/**
 * Uncaught-exception handler that captures the Java stack trace, which
 * `ApplicationExitInfo` doesn't provide. Writes one pending-crash file via
 * `CrashFileWriter`, then delegates to the previously installed handler so the
 * process still dies and other reporters keep working.
 */
class JvmCrashHandler internal constructor(
  private val fileWriter: CrashFileWriter,
  private val previousHandler: Thread.UncaughtExceptionHandler?,
  // Injectable for tests; production uses the real pid and clock.
  private val pidProvider: () -> Int = { Process.myPid() },
  private val clock: () -> Long = { System.currentTimeMillis() }
) : Thread.UncaughtExceptionHandler {
  override fun uncaughtException(thread: Thread, throwable: Throwable) {
    try {
      fileWriter.write(
        throwable = throwable,
        threadName = thread.name,
        sessionId = currentSessionId,
        pid = pidProvider(),
        crashedAtMillis = clock()
      )
    } catch (_: Throwable) {
      // Nothing on the capture path may interfere with the chain below.
    } finally {
      previousHandler?.uncaughtException(thread, throwable)
    }
  }

  companion object {
    private val installed = java.util.concurrent.atomic.AtomicBoolean(false)

    /**
     * The current main session id, stamped into pending-crash files. `null` from
     * process start until the module creates its main session, so a crash before
     * then is captured as an orphan; the module sets it once the session exists.
     */
    @Volatile
    var currentSessionId: String? = null

    /**
     * Installs the handler in front of the current default handler. Idempotent
     * per process: repeated calls (re-created module, multiple init paths)
     * leave the existing chain untouched.
     */
    fun install(fileWriter: CrashFileWriter) {
      if (!installed.compareAndSet(false, true)) {
        return
      }
      val current = Thread.getDefaultUncaughtExceptionHandler()
      Thread.setDefaultUncaughtExceptionHandler(
        JvmCrashHandler(fileWriter, current)
      )
    }

    internal fun resetForTesting() {
      installed.set(false)
      currentSessionId = null
    }
  }
}
