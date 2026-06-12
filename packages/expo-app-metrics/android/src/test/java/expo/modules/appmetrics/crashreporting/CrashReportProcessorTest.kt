package expo.modules.appmetrics.crashreporting

import android.app.ApplicationExitInfo
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * The processor is session-agnostic: it builds reports from crash evidence and
 * hands each to the `storeReport` callback. These tests assert on the callback
 * invocations (and file/cursor bookkeeping); session attribution and storage
 * are tested separately against the module's attribution callback.
 *
 * Robolectric only for `android.util.Log`; there is no database here.
 */
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class CrashReportProcessorTest {
  @get:Rule
  val tmp = TemporaryFolder()

  private lateinit var crashFileWriter: CrashFileWriter
  private lateinit var crashFileReader: CrashFileReader

  private val exitRecords = mutableListOf<ExitRecord>()
  private var cursor = 0L

  private val exitInfoProvider = ExitInfoProvider { exitRecords.toList() }

  private val lastProcessedExitStore = object : LastProcessedExitStore {
    override fun get(): Long = cursor

    override fun set(timestampMillis: Long) {
      cursor = timestampMillis
    }
  }

  data class StoreCall(val sessionId: String?, val origin: CrashOrigin, val report: CrashReport)

  private val storeCalls = mutableListOf<StoreCall>()

  private val storeReport: suspend (String?, CrashOrigin, CrashReport) -> Unit =
    { sessionId, origin, report ->
      storeCalls += StoreCall(sessionId, origin, report)
    }

  @Before
  fun setUp() {
    crashFileWriter = CrashFileWriter(tmp.root).also { it.prepare() }
    crashFileReader = CrashFileReader(tmp.root)
  }

  private fun processor(): CrashReportProcessor =
    CrashReportProcessor(
      crashFileReader = crashFileReader,
      exitInfoProvider = exitInfoProvider,
      lastProcessedExitStore = lastProcessedExitStore,
      appVersion = "1.2.3",
      storeReport = storeReport
    )

  private fun writeCrashFile(
    sessionId: String? = "crashed-session",
    pid: Int = 123,
    crashedAtMillis: Long = 1_700_000_000_000
  ) {
    crashFileWriter.write(
      throwable = IllegalStateException("boom"),
      threadName = "main",
      sessionId = sessionId,
      pid = pid,
      crashedAtMillis = crashedAtMillis
    )
  }

  private fun exitRecord(
    reason: Int = ApplicationExitInfo.REASON_CRASH,
    status: Int = 0,
    timestampMillis: Long = 1_700_000_000_500,
    pid: Int = 123,
    description: String? = null
  ): ExitRecord = ExitRecord(
    reason = reason,
    status = status,
    description = description,
    timestampMillis = timestampMillis,
    pid = pid
  )

  // region JVM crash files

  @Test
  fun `hands a crash file to the callback with its embedded session id`() =
    runTest {
      writeCrashFile(sessionId = "crashed-session")

      processor().process()

      val call = storeCalls.single()
      assertEquals("crashed-session", call.sessionId)
      assertEquals(CrashOrigin.JVM_FILE, call.origin)
      assertEquals("java.lang.IllegalStateException: boom", call.report.exceptionReason)
      assertEquals("1.2.3", call.report.appVersion)
    }

  @Test
  fun `hands an id-less crash file to the callback with a null session id`() =
    runTest {
      // A crash before the session was created carries no id — the callback
      // turns it into an orphan.
      writeCrashFile(sessionId = null)

      processor().process()

      val call = storeCalls.single()
      assertNull(call.sessionId)
      assertEquals(CrashOrigin.JVM_FILE, call.origin)
    }

  @Test
  fun `promotes a crash file with no matching record`() =
    runTest {
      // No build-type distinction anymore: a file is promoted on its own evidence.
      writeCrashFile()

      processor().process()

      assertEquals("crashed-session", storeCalls.single().sessionId)
    }

  @Test
  fun `deletes the crash file once the callback handles it`() =
    runTest {
      writeCrashFile()

      processor().process()

      assertEquals(emptyList<PendingJvmCrash>(), crashFileReader.listPendingCrashes())
    }

  @Test
  fun `deletes a malformed crash file in the same run as a valid one`() =
    runTest {
      writeCrashFile(sessionId = "crashed-session")
      val malformed = java.io.File(tmp.root, "crash-999-1700000000001.txt").apply { writeText("complete garbage") }

      processor().process()

      // The valid crash was delivered, and the corrupt leftover is reclaimed, not left forever.
      assertEquals("crashed-session", storeCalls.single().sessionId)
      assertFalse(malformed.exists())
    }

  @Test
  fun `deletes a malformed crash file even when there is nothing else to process`() =
    runTest {
      val malformed = java.io.File(tmp.root, "crash-999-1700000000001.txt").apply { writeText("complete garbage") }

      processor().process()

      assertTrue(storeCalls.isEmpty())
      assertFalse(malformed.exists())
    }

  @Test
  fun `sweeps temp files orphaned by a dead process`() =
    runTest {
      // A `.tmp` from a process that died mid-write is never read; the processor
      // must reclaim it so it doesn't leak. Use a foreign pid so it isn't treated
      // as an in-flight write by the current process.
      val foreignPid = android.os.Process.myPid() + 1
      val orphan = java.io.File(tmp.root, "crash-$foreignPid-1.txt.tmp").apply { writeText("partial") }

      processor().process()

      assertTrue(!orphan.exists())
    }

  // endregion

  // region Dedup between files and records

  @Test
  fun `a matching record is consumed and not delivered as its own report`() =
    runTest {
      writeCrashFile(sessionId = "crashed-session", pid = 123, crashedAtMillis = 1_700_000_000_000)
      exitRecords += exitRecord(pid = 123, timestampMillis = 1_700_000_000_500, description = "bare AEI description")

      processor().process()

      // One report — the file's, carrying its composed exceptionReason — not two.
      val call = storeCalls.single()
      assertEquals("crashed-session", call.sessionId)
      assertEquals("java.lang.IllegalStateException: boom", call.report.exceptionReason)
      assertNull(call.report.terminationReason)
    }

  @Test
  fun `a record matches only one file`() =
    runTest {
      // Two crash-burst files from different pids; the single death record
      // matches one only — the other stands on its own evidence.
      writeCrashFile(sessionId = "first", pid = 123, crashedAtMillis = 1_700_000_000_000)
      writeCrashFile(sessionId = "second", pid = 456, crashedAtMillis = 1_700_000_100_000)
      exitRecords += exitRecord(pid = 123, timestampMillis = 1_700_000_001_000)

      processor().process()

      // Both files promoted; the record matched only "first" and was
      // consumed, so it produced no extra (null) report.
      assertEquals(setOf("first", "second"), storeCalls.map { it.sessionId }.toSet())
      assertEquals(2, storeCalls.size)
    }

  @Test
  fun `a record outside the pid time window does not match the file`() =
    runTest {
      // Pids get reused — same pid but 6 minutes apart is a different death, so
      // the record isn't consumed: the file is promoted AND the record surfaces
      // on its own as a bare report.
      writeCrashFile(sessionId = "crashed-session", pid = 123, crashedAtMillis = 1_700_000_000_000)
      exitRecords += exitRecord(pid = 123, timestampMillis = 1_700_000_000_000 + 6 * 60 * 1000)

      processor().process()

      assertEquals(listOf("crashed-session", null), storeCalls.map { it.sessionId })
    }

  @Test
  fun `a record of a different pid does not match the file`() =
    runTest {
      writeCrashFile(sessionId = "crashed-session", pid = 123)
      exitRecords += exitRecord(pid = 456)

      processor().process()

      assertEquals(listOf("crashed-session", null), storeCalls.map { it.sessionId })
    }

  @Test
  fun `hands files to the callback before bare records`() =
    runTest {
      // The callback relies on this order so a file's richer report wins over a
      // bare record that resolves to the same session.
      writeCrashFile(sessionId = "from-file", pid = 123, crashedAtMillis = 1_700_000_000_000)
      exitRecords += exitRecord(reason = ApplicationExitInfo.REASON_CRASH_NATIVE, status = 11, pid = 456)

      processor().process()

      assertEquals(listOf("from-file", null), storeCalls.map { it.sessionId })
      assertEquals(listOf(CrashOrigin.JVM_FILE, CrashOrigin.EXIT_RECORD), storeCalls.map { it.origin })
    }

  // endregion

  // region Bare exit records

  @Test
  fun `hands a native crash to the callback with no session id and a signal`() =
    runTest {
      exitRecords += exitRecord(
        reason = ApplicationExitInfo.REASON_CRASH_NATIVE,
        status = 11,
        description = "Native crash in libhermes"
      )

      processor().process()

      val call = storeCalls.single()
      assertNull(call.sessionId)
      assertEquals(CrashOrigin.EXIT_RECORD, call.origin)
      assertEquals(11, call.report.signal)
      assertEquals("Native crash in libhermes", call.report.terminationReason)
      assertNull(call.report.exceptionReason)
      assertEquals("1.2.3", call.report.appVersion)
    }

  @Test
  fun `hands a lost-file JVM crash to the callback with no session id and no signal`() =
    runTest {
      exitRecords += exitRecord(reason = ApplicationExitInfo.REASON_CRASH)

      processor().process()

      val call = storeCalls.single()
      assertNull(call.sessionId)
      // A Java crash's status is an exit code, not a signal — must stay null.
      assertNull(call.report.signal)
    }

  @Test
  fun `ignores exit reasons outside the crash allowlist`() =
    runTest {
      exitRecords += exitRecord(reason = ApplicationExitInfo.REASON_ANR)
      exitRecords += exitRecord(reason = ApplicationExitInfo.REASON_LOW_MEMORY)
      exitRecords += exitRecord(reason = ApplicationExitInfo.REASON_SIGNALED)
      exitRecords += exitRecord(reason = ApplicationExitInfo.REASON_USER_REQUESTED)

      processor().process()

      assertTrue(storeCalls.isEmpty())
    }

  // endregion

  // region Cursor (no reprocessing)

  @Test
  fun `advances the cursor to the newest record seen`() =
    runTest {
      exitRecords += exitRecord(reason = ApplicationExitInfo.REASON_CRASH, timestampMillis = 1_000)
      exitRecords += exitRecord(reason = ApplicationExitInfo.REASON_ANR, timestampMillis = 2_000)

      processor().process()

      // Advances past the non-crash record too, so it's never reconsidered.
      assertEquals(2_000, cursor)
    }

  @Test
  fun `does not reprocess exit records on later runs`() =
    runTest {
      exitRecords += exitRecord(reason = ApplicationExitInfo.REASON_CRASH)
      processor().process()
      storeCalls.clear()

      processor().process()

      assertTrue(storeCalls.isEmpty())
    }

  @Test
  fun `processes only records newer than the cursor`() =
    runTest {
      cursor = 1_700_000_000_400
      // Older than the cursor — already processed on a prior launch.
      exitRecords += exitRecord(reason = ApplicationExitInfo.REASON_CRASH, timestampMillis = 1_700_000_000_000)
      // Newer — must be processed.
      val fresh = exitRecord(reason = ApplicationExitInfo.REASON_CRASH, timestampMillis = 1_700_000_000_500)
      exitRecords += fresh

      processor().process()

      assertEquals(1, storeCalls.size)
      assertEquals(fresh.timestampMillis, cursor)
    }

  // endregion
}
