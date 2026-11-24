package expo.modules.observe

import android.content.Context
import android.content.ContextWrapper
import androidx.core.os.bundleOf
import androidx.test.core.app.ApplicationProvider
import androidx.work.Configuration
import androidx.work.testing.SynchronousExecutor
import androidx.work.testing.WorkManagerTestInitHelper
import expo.modules.appmetrics.AppMetricsModule
import expo.modules.appmetrics.ObserveConsent
import io.mockk.every
import io.mockk.mockk
import io.mockk.spyk
import io.mockk.unmockkAll
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config

// `setConsent` with the real consent gate and the real App Metrics consent lock.
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class SetConsentTest {
  private val context: Context = ApplicationProvider.getApplicationContext()

  @Before
  fun setUp() {
    WorkManagerTestInitHelper.initializeTestWorkManager(
      context,
      Configuration.Builder().setExecutor(SynchronousExecutor()).build()
    )
    context.getSharedPreferences("dev.expo.app-metrics", Context.MODE_PRIVATE).edit().clear().commit()
    setManifestConsent("not-granted")
    ObserveConsent.load(context)
  }

  @After
  fun tearDown() {
    unmockkAll()
    context.getSharedPreferences("dev.expo.app-metrics", Context.MODE_PRIVATE).edit().clear().commit()
    setManifestConsent("granted")
    ObserveConsent.load(context)
  }

  private fun setManifestConsent(consent: String) {
    shadowOf(context.packageManager).getInternalMutablePackageInfo(context.packageName).applicationInfo!!.metaData =
      bundleOf("expo.modules.observe.CONSENT" to consent)
  }

  // The module with `context` as its React context. The grant steps use the session objects that
  // `OnCreate` makes, so those are mocks.
  private fun appMetricsModule(context: Context) = spyk(AppMetricsModule()).apply {
    every { appContext } returns mockk(relaxed = true) { every { reactContext } returns context }
    mainSession = mockk(relaxed = true)
    sessionManager = mockk(relaxed = true)
  }

  @Test
  fun `a grant after a concurrent revoke keeps the settings it saves`() {
    // The app sends its config at startup, before the grant. It stays in memory until the grant.
    ObservePreferences.setConfig(context, PersistedConfig(sampleRate = 0.5))
    val revokeDeletes = CountDownLatch(1)
    val resumeRevoke = CountDownLatch(1)
    // Pauses the revoke in its first Observe delete.
    val pausingContext = object : ContextWrapper(context) {
      override fun deleteDatabase(name: String): Boolean {
        if (name == LEGACY_DATABASE_NAME && revokeDeletes.count > 0) {
          revokeDeletes.countDown()
          resumeRevoke.await(5, TimeUnit.SECONDS)
        }
        return super.deleteDatabase(name)
      }
    }
    val module = appMetricsModule(pausingContext)

    val revoke = thread { runBlocking { applyConsent(pausingContext, ConsentValue.NOT_GRANTED, module::setConsent) } }
    assertTrue(revokeDeletes.await(5, TimeUnit.SECONDS))
    val grant = thread { runBlocking { applyConsent(pausingContext, ConsentValue.GRANTED, module::setConsent) } }
    // The grant finishes, or waits for the consent lock that the revoke holds.
    while (grant.isAlive && grant.state != Thread.State.WAITING && grant.state != Thread.State.TIMED_WAITING) {
      Thread.sleep(1)
    }
    resumeRevoke.countDown()
    revoke.join()
    grant.join()

    assertTrue(ObserveConsent.isGranted)
    assertTrue(context.getSharedPreferences("dev.expo.observe", Context.MODE_PRIVATE).contains("config"))
  }
}
