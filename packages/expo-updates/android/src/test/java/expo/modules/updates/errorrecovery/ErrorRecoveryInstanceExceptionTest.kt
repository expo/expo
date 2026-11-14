package expo.modules.updates.errorrecovery

import android.os.Handler
import com.facebook.react.devsupport.interfaces.DevSupportManager
import expo.modules.updates.logging.UpdatesLogger
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ErrorRecoveryInstanceExceptionTest {
  private val logger = mockk<UpdatesLogger>(relaxed = true)
  private val handler = mockk<Handler>(relaxed = true)
  private val errorRecovery = ErrorRecovery(logger).also { it.handler = handler }

  @Test
  fun `does not take an exception before monitoring starts`() {
    assertFalse(errorRecovery.onReactInstanceException(Exception("boom")))
    verify(exactly = 0) { handler.sendMessage(any()) }
  }

  @Test
  fun `takes an exception while it monitors the launch`() {
    errorRecovery.startMonitoring(mockk<DevSupportManager>(relaxed = true))

    assertTrue(errorRecovery.onReactInstanceException(Exception("boom")))
    verify(exactly = 1) { handler.sendMessage(any()) }
  }

  @Test
  fun `does not take an exception after the error recovery window`() {
    val endOfWindow = slot<Runnable>()
    every { handler.postDelayed(capture(endOfWindow), any()) } returns true
    errorRecovery.startMonitoring(mockk<DevSupportManager>(relaxed = true))
    errorRecovery.handleContentAppeared()
    endOfWindow.captured.run()

    assertFalse(errorRecovery.onReactInstanceException(Exception("boom")))
  }
}
