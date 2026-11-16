package expo.modules.observe.shared.dispatch

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.work.ListenableWorker.Result
import androidx.work.testing.TestListenableWorkerBuilder
import androidx.work.workDataOf
import expo.modules.observe.shared.AppMetrics
import io.mockk.every
import io.mockk.mockkObject
import io.mockk.unmockkAll
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ObservabilityBackgroundWorkerTest {
  private val context = ApplicationProvider.getApplicationContext<Context>()

  @Before
  fun setUp() {
    // The real host is process-wide and can be set only once, so each test sets the state it needs.
    mockkObject(AppMetrics)
    every { AppMetrics.isConfigured } returns false
  }

  @After
  fun tearDown() {
    unmockkAll()
  }

  @Test
  fun `retries when the host is not configured`() = runTest {
    assertEquals(Result.retry(), worker(runAttemptCount = 0).doWork())
  }

  @Test
  fun `retries below the attempt cap`() = runTest {
    assertEquals(Result.retry(), worker(runAttemptCount = 2).doWork())
  }

  @Test
  fun `fails at the attempt cap`() = runTest {
    assertEquals(Result.failure(), worker(runAttemptCount = 3).doWork())
  }

  private fun worker(runAttemptCount: Int) =
    TestListenableWorkerBuilder<ObservabilityBackgroundWorker>(context)
      .setInputData(workDataOf("projectId" to "project", "baseUrl" to "https://example.com"))
      .setRunAttemptCount(runAttemptCount)
      .build()
}
