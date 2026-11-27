package expo.modules.observe

import android.content.Context
import android.content.ContextWrapper
import android.content.SharedPreferences
import androidx.test.core.app.ApplicationProvider
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.ModuleRegistry
import expo.modules.kotlin.exception.CodedException
import expo.modules.observe.shared.AppMetricsPreferences
import expo.modules.observe.shared.ObserveConsent
import expo.modules.observe.shared.storage.LogRecord
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import io.mockk.spyk
import io.mockk.unmockkAll
import java.io.File
import java.lang.ref.WeakReference
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class AppMetricsModuleConsentTest {
  private val context: Context = ApplicationProvider.getApplicationContext()

  @Before
  fun setUp() {
    context.getSharedPreferences("dev.expo.app-metrics", Context.MODE_PRIVATE).edit().clear().commit()
    // The test manifest has no consent value, so consent is granted.
    ObserveConsent.load(context)
  }

  @After
  fun tearDown() {
    unmockkAll()
    File(context.dataDir, "shared_prefs").setWritable(true)
    setUp()
  }

  // The module with `context` as its React context. The grant steps use the session objects that
  // `OnCreate` makes, so those are mocks.
  private fun module(context: Context) = spyk(AppMetricsModule()).apply {
    every { appContext } returns mockk(relaxed = true) { every { reactContext } returns context }
    mainSession = mockk(relaxed = true)
    sessionManager = mockk(relaxed = true)
  }

  @Test
  fun `reports captured before a grant are dropped when the queue runs after the grant`() = runTest {
    AppMetricsPreferences.saveObserveConsent(context, "not-granted")
    ObserveConsent.load(context)
    val appContext = mockk<AppContext>(relaxed = true)
    every { appContext.modulesQueue } returns this
    val module = AppMetricsModule()
    ModuleRegistry(WeakReference(appContext)).register(module)
    module.mainSession = mockk(relaxed = true)
    val logs = mutableListOf<LogRecord>()
    coEvery { module.mainSession.addLogs(any()) } answers { logs.addAll(firstArg<List<LogRecord>>()) }
    val functions = module.definition().syncFunctions
    fun report(label: String) {
      functions.getValue("logEvent").callUserImplementation(arrayOf(label, null), appContext)
      functions.getValue("reportError").callUserImplementation(arrayOf(mapOf("message" to label)), appContext)
      functions.getValue("reportFeedback").callUserImplementation(arrayOf(mapOf("id" to label)), appContext)
    }

    report("before")
    assertTrue(ObserveConsent.update(context, granted = true).changed)
    report("after")
    testScheduler.runCurrent()

    assertEquals(listOf("after", "js.exception", "expo.feedback"), logs.map { it.name })
    assertTrue(logs.none { it.attributes?.contains("before") == true })
  }

  private fun setConsentError(module: AppMetricsModule, granted: Boolean, afterRevoke: suspend () -> Unit = {}): Throwable =
    runBlocking {
      try {
        module.setConsent(granted, afterRevoke)
      } catch (e: Throwable) {
        return@runBlocking e
      }
      fail("setConsent did not fail")
      throw AssertionError()
    }

  @Test
  fun `a failed revoke save is reported before a failed delete`() {
    val deleteError = IllegalStateException("database")
    val failingDelete = object : ContextWrapper(context) {
      override fun deleteDatabase(name: String): Boolean = throw deleteError
    }
    var afterRevokeRan = false
    // `commit` keeps the value in memory and fails to write the file.
    assertTrue(File(context.dataDir, "shared_prefs").setWritable(false))

    val error = setConsentError(module(failingDelete), granted = false) { afterRevokeRan = true }

    assertTrue(error is CodedException && error.message!!.contains("'not-granted'"))
    assertEquals(listOf(deleteError), error.suppressed.toList())
    assertTrue(afterRevokeRan)
    assertFalse(ObserveConsent.isGranted)
  }

  @Test
  fun `a revoke that cannot read the settings is not reported as unreadable exit records`() {
    val settingsError = IllegalStateException("settings")
    val unreadableSettings = object : ContextWrapper(context) {
      override fun getSharedPreferences(name: String, mode: Int): SharedPreferences = throw settingsError
    }

    val error = setConsentError(module(unreadableSettings), granted = false)

    assertSame(settingsError, error)
  }
}
