package expo.modules.appmetrics

import android.content.Context
import android.content.pm.PackageManager
import androidx.core.os.bundleOf
import androidx.test.core.app.ApplicationProvider
import android.app.ActivityManager
import android.app.ApplicationExitInfo
import expo.modules.appmetrics.crashreporting.CrashFileFormat
import expo.modules.appmetrics.crashreporting.CrashFileReader
import expo.modules.appmetrics.crashreporting.CrashReportProcessor
import expo.modules.appmetrics.crashreporting.ExitInfoProvider
import expo.modules.appmetrics.crashreporting.ExitRecord
import expo.modules.appmetrics.crashreporting.PreferencesLastProcessedExitStore
import expo.modules.appmetrics.utils.TimeUtils
import kotlinx.coroutines.test.runTest
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.unmockkAll
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import javax.xml.parsers.DocumentBuilderFactory
import kotlin.concurrent.thread
import kotlinx.coroutines.runBlocking
import org.w3c.dom.Element
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class ObserveConsentTest {
  private val context: Context = ApplicationProvider.getApplicationContext()

  @Before
  fun setUp() {
    context.getSharedPreferences("dev.expo.app-metrics", Context.MODE_PRIVATE).edit().clear().commit()
  }

  // Clears the saved value, then `load` grants consent, because the test manifest has no consent value.
  @After
  fun tearDown() {
    unmockkAll()
    setUp()
    ObserveConsent.load(context)
  }

  private fun settings() = context.getSharedPreferences("dev.expo.app-metrics", Context.MODE_PRIVATE)

  private fun savedConsent(): String? = settings().getString("observeConsent", null)

  @Test
  fun `absent consent value grants consent`() {
    assertTrue(ObserveConsent.resolve(null, null))
  }

  @Test
  fun `consent value granted grants consent`() {
    assertTrue(ObserveConsent.resolve(null, "granted"))
  }

  @Test
  fun `consent value not-granted denies consent`() {
    assertFalse(ObserveConsent.resolve(null, "not-granted"))
  }

  @Test
  fun `unknown consent value denies consent`() {
    assertFalse(ObserveConsent.resolve(null, "pending"))
    assertFalse(ObserveConsent.resolve(null, ""))
  }

  @Test
  fun `saved value overrides the manifest value`() {
    assertFalse(ObserveConsent.resolve("not-granted", "granted"))
    assertTrue(ObserveConsent.resolve("granted", "not-granted"))
    assertFalse(ObserveConsent.resolve("not-granted", null))
  }

  @Test
  fun `load reads the consent value from the manifest meta-data`() {
    setManifestConsent("not-granted")
    ObserveConsent.load(context)
    assertTrue(ObserveConsent.isLoaded)
    assertFalse(ObserveConsent.isGranted)

    // Last, so `tearDown` grants consent for the other tests.
    setManifestConsent("granted")
    ObserveConsent.load(context)
    assertTrue(ObserveConsent.isGranted)
  }

  @Test
  fun `load denies consent when the manifest cannot be read`() {
    setManifestConsent("granted")
    ObserveConsent.load(context)
    val unreadable = mockk<Context> {
      every { getSharedPreferences(any(), any()) } answers { context.getSharedPreferences(firstArg(), secondArg()) }
      every { packageName } returns "missing"
      every { packageManager.getApplicationInfo("missing", PackageManager.GET_META_DATA) } throws
        PackageManager.NameNotFoundException()
    }

    ObserveConsent.load(unreadable)

    assertFalse(ObserveConsent.isGranted)
  }

  private fun setManifestConsent(consent: String) {
    shadowOf(context.packageManager).getInternalMutablePackageInfo(context.packageName).applicationInfo!!.metaData =
      bundleOf("expo.modules.observe.CONSENT" to consent)
  }

  @Test
  fun `load reads the saved value`() {
    ObserveConsent.update(context, granted = false)

    ObserveConsent.load(context)

    assertFalse(ObserveConsent.isGranted)
  }

  @Test
  fun `update saves the value and changes the gate`() {
    ObserveConsent.load(context)

    assertFalse(ObserveConsent.update(context, granted = true).changed)
    assertEquals("granted", savedConsent())
    assertTrue(ObserveConsent.isGranted)

    assertTrue(ObserveConsent.update(context, granted = false).changed)
    assertEquals("not-granted", savedConsent())
    assertFalse(ObserveConsent.isGranted)

    assertFalse(ObserveConsent.update(context, granted = false).changed)
  }

  @Test
  fun `a grant after a revoke only saves the value until the next launch`() {
    ObserveConsent.update(context, granted = false)
    ObserveConsent.load(context)

    assertTrue(ObserveConsent.update(context, granted = true).changed)
    assertTrue(ObserveConsent.update(context, granted = false).changed)
    assertFalse(ObserveConsent.update(context, granted = true).changed)
    assertEquals("granted-at-next-launch", savedConsent())
    assertFalse(ObserveConsent.isGranted)

    ObserveConsent.load(context)
    assertTrue(ObserveConsent.isGranted)
    assertEquals("granted", savedConsent())
  }

  @Test
  fun `after a deferred grant, the next launch reports only crashes from after the launch`() = runTest {
    ObserveConsent.load(context)
    ObserveConsent.update(context, granted = false)
    ObserveConsent.update(context, granted = true)
    val inactiveProcessCrash = crashRecord(System.currentTimeMillis())

    ObserveConsent.load(context)
    val activeProcessCrash = crashRecord(System.currentTimeMillis() + 1_000)
    val reported = mutableListOf<String?>()
    CrashReportProcessor(
      crashFileReader = CrashFileReader(File(context.cacheDir, "crashes")),
      exitInfoProvider = ExitInfoProvider { listOf(inactiveProcessCrash, activeProcessCrash) },
      lastProcessedExitStore = PreferencesLastProcessedExitStore(context),
      appVersion = "1.0.0"
    ) { _, _, report, _ -> reported += report.timestampBegin }.process()

    assertTrue(ObserveConsent.isGranted)
    assertEquals(listOf(TimeUtils.millisToTimestamp(activeProcessCrash.timestampMillis)), reported)
  }

  private fun reportedCrashTimes(records: List<ExitRecord>): List<String?> = runBlocking {
    val reported = mutableListOf<String?>()
    CrashReportProcessor(
      crashFileReader = CrashFileReader(File(context.cacheDir, "crashes")),
      exitInfoProvider = ExitInfoProvider { records },
      lastProcessedExitStore = PreferencesLastProcessedExitStore(context),
      appVersion = "1.0.0"
    ) { _, _, report, _ -> reported += report.timestampBegin }.process()
    reported
  }

  private fun timestamp(record: ExitRecord) = TimeUtils.millisToTimestamp(record.timestampMillis)

  @Test
  fun `the first grant saves the consent and the newest exit record as the crash cursor`() {
    ObserveConsent.update(context, granted = false)
    ObserveConsent.load(context)
    val now = System.currentTimeMillis()
    // The clock can be behind the time of a record, so the cursor is the newest record, not the clock.
    val beforeGrant = listOf(crashRecord(now - 60_000), crashRecord(now + 60_000))

    ObserveConsent.update(context, granted = true, exitInfoProvider = { beforeGrant })

    assertEquals("granted", savedOnDisk()["observeConsent"])
    assertEquals((now + 60_000).toString(), savedOnDisk()["lastProcessedExitMillis"])

    // The process dies after the grant. The next launch reports only the crashes from after the grant.
    ObserveConsent.load(context)
    val afterGrant = crashRecord(now + 120_000)
    assertEquals(listOf(timestamp(afterGrant)), reportedCrashTimes(beforeGrant + afterGrant))
  }

  @Test
  fun `the first grant with no exit records saves the cursor at 0`() {
    ObserveConsent.update(context, granted = false)
    ObserveConsent.load(context)

    ObserveConsent.update(context, granted = true, exitInfoProvider = { emptyList() })

    assertEquals("0", savedOnDisk()["lastProcessedExitMillis"])
    ObserveConsent.load(context)
    val afterGrant = crashRecord(System.currentTimeMillis())
    assertEquals(listOf(timestamp(afterGrant)), reportedCrashTimes(listOf(afterGrant)))
  }

  @Test
  @Config(manifest = Config.NONE, sdk = [30])
  fun `a first grant that cannot read the exit records saves nothing, and a retry grants`() {
    ObserveConsent.update(context, granted = false)
    ObserveConsent.load(context)
    AppMetricsPreferences.setEnvironment(context, "staging")
    val failingQuery = mockk<Context> {
      every { getSharedPreferences(any(), any()) } answers { context.getSharedPreferences(firstArg(), secondArg()) }
      every { packageName } returns context.packageName
      every { getSystemService(ActivityManager::class.java) } returns mockk {
        every { getHistoricalProcessExitReasons(any(), any(), any()) } throws IllegalStateException("system server")
      }
    }

    assertThrows(ExitRecordsUnavailableException::class.java) { ObserveConsent.update(failingQuery, granted = true) }
    assertFalse(ObserveConsent.isGranted)
    assertEquals(mapOf("observeConsent" to "not-granted"), savedOnDisk())

    // A record dated ahead of the clock, for example after the clock moved back.
    val beforeGrant = crashRecord(System.currentTimeMillis() + 60_000)
    ObserveConsent.update(context, granted = true, exitInfoProvider = { listOf(beforeGrant) })
    assertTrue(ObserveConsent.isGranted)
    assertEquals("staging", savedOnDisk()["environment"])
    ObserveConsent.load(context)
    assertEquals(emptyList<String?>(), reportedCrashTimes(listOf(beforeGrant)))
  }

  @Test
  fun `the first grant keeps a newer saved crash cursor`() {
    ObserveConsent.update(context, granted = false)
    ObserveConsent.load(context)
    settings().edit().putLong("lastProcessedExitMillis", 9_000).commit()

    ObserveConsent.update(context, granted = true, exitInfoProvider = { listOf(crashRecord(5_000)) })

    assertEquals("9000", savedOnDisk()["lastProcessedExitMillis"])
  }

  @Test
  fun `the first grant saves its crash cursor over a cursor set without consent`() {
    ObserveConsent.update(context, granted = false)
    ObserveConsent.load(context)
    AppMetricsPreferences.setLastProcessedExitTimestampMillis(context, 5)

    ObserveConsent.update(context, granted = true, exitInfoProvider = { listOf(crashRecord(9_000)) })

    assertEquals("9000", savedOnDisk()["lastProcessedExitMillis"])
  }

  @Test
  fun `a grant while consent is granted does not move the crash cursor`() {
    ObserveConsent.load(context)
    val reported = crashRecord(3_000)
    reportedCrashTimes(listOf(reported))
    val unreported = crashRecord(9_000)

    ObserveConsent.update(context, granted = true, exitInfoProvider = { listOf(reported, unreported) })

    assertEquals("3000", savedOnDisk()["lastProcessedExitMillis"])
    assertEquals(listOf(timestamp(unreported)), reportedCrashTimes(listOf(reported, unreported)))
  }

  @Test
  fun `a failed first grant is not saved by a later write`() {
    ObserveConsent.update(context, granted = false)
    ObserveConsent.load(context)

    val update = withUnwritableSettings {
      ObserveConsent.update(context, granted = true, exitInfoProvider = { listOf(crashRecord(5_000)) })
    }
    // A later write of the file, here the cleanup of a launch without consent, saves the values in memory.
    deleteStoredData(context)

    assertEquals(ObserveConsent.Update(changed = false, isSaved = false), update)
    assertFalse(ObserveConsent.isGranted)
    assertEquals(mapOf("observeConsent" to "not-granted"), savedOnDisk())
  }

  @Test
  fun `a failed grant after a revoke is not saved by a later write`() {
    ObserveConsent.load(context)
    ObserveConsent.update(context, granted = false)

    withUnwritableSettings { ObserveConsent.update(context, granted = true) }
    settings().edit().putString("environment", "production").commit()

    assertEquals("not-granted", savedOnDisk()["observeConsent"])
  }

  @Test
  fun `a failed deferred grant at launch keeps the deferred grant for the next launch`() {
    ObserveConsent.load(context)
    ObserveConsent.update(context, granted = false)
    ObserveConsent.update(context, granted = true)

    withUnwritableSettings { ObserveConsent.load(context) }
    assertFalse(ObserveConsent.isGranted)
    // The cleanup of a launch without consent keeps the consent value and deletes the cursor.
    deleteStoredData(context)
    assertEquals(mapOf("observeConsent" to "granted-at-next-launch"), savedOnDisk())

    ObserveConsent.load(context)
    assertTrue(ObserveConsent.isGranted)
    assertEquals("granted", savedOnDisk()["observeConsent"])
    assertTrue(savedOnDisk().containsKey("lastProcessedExitMillis"))
  }

  // `SharedPreferences.commit` changes the values in memory, then fails to write the file.
  private fun <T> withUnwritableSettings(body: () -> T): T {
    val directory = File(context.dataDir, "shared_prefs")
    assertTrue(directory.setWritable(false))
    try {
      return body()
    } finally {
      directory.setWritable(true)
    }
  }

  // The values in the settings file, which a new process reads.
  private fun savedOnDisk(): Map<String, String> {
    val file = File(context.dataDir, "shared_prefs/dev.expo.app-metrics.xml")
    if (!file.exists()) {
      return emptyMap()
    }
    val elements = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(file).documentElement.childNodes
    return (0 until elements.length)
      .map { elements.item(it) }
      .filterIsInstance<Element>()
      .associate { it.getAttribute("name") to (it.getAttribute("value").ifEmpty { it.textContent }) }
  }

  private fun crashRecord(timestampMillis: Long) = ExitRecord(
    reason = ApplicationExitInfo.REASON_CRASH,
    status = 0,
    description = null,
    timestampMillis = timestampMillis,
    pid = 1
  )

  @Test
  fun `a failed save still revokes, and a grant changes nothing`() {
    // A relaxed mock returns `false` from `commit()`.
    val unsaved = mockk<Context>(relaxed = true)
    ObserveConsent.load(context)

    assertEquals(ObserveConsent.Update(changed = true, isSaved = false), ObserveConsent.update(unsaved, granted = false))
    assertFalse(ObserveConsent.isGranted)

    ObserveConsent.update(context, granted = false)
    ObserveConsent.load(context)
    assertEquals(ObserveConsent.Update(changed = false, isSaved = false), ObserveConsent.update(unsaved, granted = true))
    assertFalse(ObserveConsent.isGranted)
  }

  @Test
  fun `the first grant saves the settings kept in memory, and a grant after a revoke does not`() {
    ObserveConsent.update(context, granted = false)
    ObserveConsent.load(context)
    AppMetricsPreferences.setEnvironment(context, "staging")

    ObserveConsent.update(context, granted = true)
    assertEquals("staging", settings().getString("environment", null))

    ObserveConsent.update(context, granted = false)
    AppMetricsPreferences.setEnvironment(context, "production")
    ObserveConsent.update(context, granted = true)
    assertEquals("staging", settings().getString("environment", null))
  }

  // Pauses the "setter" thread after its first gate read and runs `transition` on another thread in
  // that gap. Resumes the setter once the transition finished or waits for the gate lock.
  private fun runInSetterGap(setter: () -> Unit, transition: () -> Unit) {
    val checked = CountDownLatch(1)
    val resume = CountDownLatch(1)
    mockkObject(ObserveConsent)
    every { ObserveConsent.isGranted } answers {
      val isGranted = callOriginal()
      if (Thread.currentThread().name == "setter" && checked.count > 0) {
        checked.countDown()
        resume.await(5, TimeUnit.SECONDS)
      }
      isGranted
    }
    val setterThread = thread(name = "setter") { setter() }
    assertTrue(checked.await(5, TimeUnit.SECONDS))
    val transitionThread = thread { transition() }
    while (transitionThread.isAlive && transitionThread.state != Thread.State.BLOCKED) {
      Thread.sleep(1)
    }
    resume.countDown()
    setterThread.join()
    transitionThread.join()
  }

  @Test
  fun `a setter that reads the gate before the first grant still saves its value`() {
    ObserveConsent.update(context, granted = false)
    ObserveConsent.load(context)

    runInSetterGap(
      setter = { AppMetricsPreferences.setEnvironment(context, "set-during-grant") },
      transition = { ObserveConsent.update(context, granted = true) }
    )

    assertEquals("set-during-grant", settings().getString("environment", null))
  }

  @Test
  fun `a setter that reads the gate before a revoke saves nothing`() {
    ObserveConsent.load(context)

    runInSetterGap(
      setter = { AppMetricsPreferences.setEnvironment(context, "set-during-revoke") },
      transition = {
        ObserveConsent.update(context, granted = false)
        deleteStoredData(context)
      }
    )

    assertEquals(mapOf("observeConsent" to "not-granted"), settings().all)
  }

  @Test
  fun `deleteStoredData keeps the consent value`() {
    ObserveConsent.update(context, granted = false)
    settings().edit().putString("environment", "production").commit()

    deleteStoredData(context)

    assertEquals(mapOf("observeConsent" to "not-granted"), settings().all)
  }

  @Test
  fun `deleteStoredData deletes the database, crash files, pending errors, and settings`() {
    val database = context.getDatabasePath("app_metrics").apply {
      parentFile?.mkdirs()
      writeText("db")
    }
    val crashFile = File(CrashFileFormat.crashesDir(context), "crash-1-1.json").apply {
      parentFile?.mkdirs()
      writeText("{}")
    }
    val pendingError = File(context.noBackupFilesDir, "ExpoAppMetrics/pending-errors/error.json").apply {
      parentFile?.mkdirs()
      writeText("{}")
    }
    context.getSharedPreferences("dev.expo.app-metrics", Context.MODE_PRIVATE).edit().putString("environment", "production").commit()

    deleteStoredData(context)

    assertFalse(database.exists())
    assertFalse(crashFile.exists())
    assertFalse(pendingError.exists())
    assertTrue(context.getSharedPreferences("dev.expo.app-metrics", Context.MODE_PRIVATE).all.isEmpty())
  }
}
