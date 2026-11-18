package expo.modules.observe

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.work.Configuration
import androidx.work.WorkInfo
import androidx.work.WorkManager
import androidx.work.testing.SynchronousExecutor
import androidx.work.testing.WorkManagerTestInitHelper
import expo.modules.appmetrics.ObserveConsent
import io.mockk.every
import io.mockk.mockkObject
import io.mockk.unmockkAll
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class DeleteObserveDataTest {
  private val context: Context = ApplicationProvider.getApplicationContext()

  @Before
  fun setUp() {
    mockkObject(ObserveConsent)
    every { ObserveConsent.isGranted } returns true
    WorkManagerTestInitHelper.initializeTestWorkManager(
      context,
      Configuration.Builder().setExecutor(SynchronousExecutor()).build()
    )
  }

  @After
  fun tearDown() {
    unmockkAll()
  }

  @Test
  fun `deletes the cursors, the legacy database, and the scheduled dispatch`() = runTest {
    ObservePreferences.setLastDispatchedMetricId(context, 5)
    ObservePreferences.setLastDispatchedLogId(context, 7)
    context.openOrCreateDatabase(LEGACY_DATABASE_NAME, Context.MODE_PRIVATE, null).close()
    ObservabilityBackgroundWorker.scheduleBackgroundDispatch(context, "project", "https://example.com")

    deleteObserveData(context)

    assertEquals(-1L, ObservePreferences.getLastDispatchedMetricId(context))
    assertEquals(-1L, ObservePreferences.getLastDispatchedLogId(context))
    assertFalse(context.getDatabasePath(LEGACY_DATABASE_NAME).exists())
    val work = WorkManager.getInstance(context).getWorkInfosForUniqueWork(ObservabilityBackgroundWorker.WORK_NAME).get()
    assertTrue(work.isNotEmpty() && work.all { it.state == WorkInfo.State.CANCELLED })
  }
}
