package expo.modules.appmetrics

import android.content.Context
import android.content.pm.PackageManager
import androidx.core.os.bundleOf
import androidx.test.core.app.ApplicationProvider
import expo.modules.appmetrics.crashreporting.CrashFileFormat
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.unmockkAll
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
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
    assertEquals("granted", savedConsent())
    assertFalse(ObserveConsent.isGranted)

    ObserveConsent.load(context)
    assertTrue(ObserveConsent.isGranted)
  }

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
    AppMetricsPreferences.setEnvironment(context, "production")

    deleteStoredData(context)

    assertFalse(database.exists())
    assertFalse(crashFile.exists())
    assertFalse(pendingError.exists())
    assertTrue(context.getSharedPreferences("dev.expo.app-metrics", Context.MODE_PRIVATE).all.isEmpty())
  }
}
