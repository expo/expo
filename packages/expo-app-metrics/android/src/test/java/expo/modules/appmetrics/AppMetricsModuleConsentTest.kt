package expo.modules.appmetrics

import android.content.Context
import android.content.ContextWrapper
import android.content.SharedPreferences
import androidx.test.core.app.ApplicationProvider
import expo.modules.kotlin.exception.CodedException
import io.mockk.every
import io.mockk.mockk
import io.mockk.spyk
import io.mockk.unmockkAll
import java.io.File
import kotlinx.coroutines.runBlocking
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
