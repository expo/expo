package expo.modules.observe

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.work.Configuration
import androidx.work.WorkInfo
import androidx.work.WorkManager
import androidx.work.testing.SynchronousExecutor
import androidx.work.testing.WorkManagerTestInitHelper
import expo.modules.observe.shared.ObserveConsent
import expo.modules.observe.shared.dispatch.LEGACY_DATABASE_NAME
import expo.modules.observe.shared.dispatch.ObservabilityBackgroundWorker
import expo.modules.observe.shared.dispatch.ObservePreferences
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockkObject
import io.mockk.unmockkAll
import kotlinx.coroutines.CancellationException
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
@Config(sdk = [28])
class DeleteObserveDataTest {
  private val context: Context = ApplicationProvider.getApplicationContext()

  // The consent gate. The app metrics consent change closes it for a revoke.
  private var isGranted = true

  @Before
  fun setUp() {
    mockkObject(ObserveConsent)
    every { ObserveConsent.isGranted } answers { isGranted }
    WorkManagerTestInitHelper.initializeTestWorkManager(
      context,
      Configuration.Builder().setExecutor(SynchronousExecutor()).build()
    )
    ObservePreferences.setLastDispatchedMetricId(context, 5)
    ObservePreferences.setLastDispatchedLogId(context, 7)
    context.openOrCreateDatabase(LEGACY_DATABASE_NAME, Context.MODE_PRIVATE, null).close()
  }

  @After
  fun tearDown() {
    unmockkAll()
  }

  // Read without the gate, which reads memory once a revoke closes it.
  private fun savedSettings() = context.getSharedPreferences("dev.expo.observe", Context.MODE_PRIVATE).all

  private fun assertDataDeleted() {
    assertTrue(savedSettings().isEmpty())
    assertFalse(context.getDatabasePath(LEGACY_DATABASE_NAME).exists())
  }

  // Like the app metrics revoke: closes the gate, runs `afterRevoke` under the consent lock, then
  // fails with `error` when it is given.
  private fun revoke(error: Exception? = null): suspend (Boolean, suspend () -> Unit) -> Unit = { _, afterRevoke ->
    isGranted = false
    afterRevoke()
    error?.let { throw it }
  }

  private fun failDispatchCancel(error: Exception) {
    mockkObject(ObservabilityBackgroundWorker.Companion)
    coEvery { ObservabilityBackgroundWorker.cancelBackgroundDispatch(any()) } throws error
  }

  private suspend fun applyRevokeError(setAppMetricsConsent: suspend (Boolean, suspend () -> Unit) -> Unit): Throwable {
    try {
      applyConsent(context, ConsentValue.NOT_GRANTED, setAppMetricsConsent)
    } catch (e: Throwable) {
      return e
    }
    fail("The revoke did not fail")
    throw AssertionError()
  }

  @Test
  fun `a revoke deletes the cursors, the legacy database, and the scheduled dispatch`() = runTest {
    ObservabilityBackgroundWorker.scheduleBackgroundDispatch(context, "project", "https://example.com")

    applyConsent(context, ConsentValue.NOT_GRANTED, revoke())

    assertDataDeleted()
    val work = WorkManager.getInstance(context).getWorkInfosForUniqueWork(ObservabilityBackgroundWorker.WORK_NAME).get()
    assertTrue(work.isNotEmpty() && work.all { it.state == WorkInfo.State.CANCELLED })
  }

  @Test
  fun `a revoke deletes the data before the consent lock is released`() = runTest {
    applyConsent(context, ConsentValue.NOT_GRANTED) { _, afterRevoke ->
      isGranted = false
      afterRevoke()
      // A grant that waits for the lock cannot save its settings before this delete.
      assertDataDeleted()
    }
  }

  @Test
  fun `a revoke canceled before the gate closes deletes nothing`() = runTest {
    // Cancellation while the revoke waits for an earlier consent change.
    val canceled = CancellationException("canceled")

    val error = applyRevokeError { _, _ -> throw canceled }

    assertSame(canceled, error)
    assertEquals(mapOf("lastDispatchedMetricId" to 5L, "lastDispatchedLogId" to 7L), savedSettings())
    assertTrue(context.getDatabasePath(LEGACY_DATABASE_NAME).exists())
  }

  @Test
  fun `a failed dispatch cancel still deletes the data and fails the revoke`() = runTest {
    val cancelError = IllegalStateException("WorkManager is not initialized")
    failDispatchCancel(cancelError)

    val error = applyRevokeError(revoke())

    assertSame(cancelError, error)
    assertDataDeleted()
  }

  @Test
  fun `a failed local delete still deletes the rest and cancels the dispatch`() = runTest {
    ObservabilityBackgroundWorker.scheduleBackgroundDispatch(context, "project", "https://example.com")
    val deleteError = IllegalStateException("settings")
    mockkObject(ObservePreferences)
    every { ObservePreferences.deleteStoredSettings(any()) } throws deleteError

    val error = applyRevokeError(revoke())

    assertSame(deleteError, error)
    assertFalse(context.getDatabasePath(LEGACY_DATABASE_NAME).exists())
    val work = WorkManager.getInstance(context).getWorkInfosForUniqueWork(ObservabilityBackgroundWorker.WORK_NAME).get()
    assertTrue(work.isNotEmpty() && work.all { it.state == WorkInfo.State.CANCELLED })
  }

  @Test
  fun `a coroutine canceled during the dispatch cancel still deletes the data`() = runTest {
    val canceled = CancellationException("canceled")
    failDispatchCancel(canceled)

    val error = applyRevokeError(revoke())

    assertSame(canceled, error)
    assertDataDeleted()
  }

  @Test
  fun `a failed consent save is reported before a failed dispatch cancel`() = runTest {
    val saveError = IllegalStateException("The consent was not saved")
    val cancelError = IllegalStateException("WorkManager is not initialized")
    failDispatchCancel(cancelError)

    val error = applyRevokeError(revoke(saveError))

    assertSame(saveError, error)
    assertEquals(listOf(cancelError), error.suppressed.toList())
    assertDataDeleted()
  }
}
