package expo.modules.updates.errorrecovery

import android.os.Handler
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogger
import io.mockk.mockk
import io.mockk.verify
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ErrorRecoveryLoggingTest {
  @Test
  fun `logs a handled exception with the JSRuntimeError code and its message`() {
    val logger = mockk<UpdatesLogger>(relaxed = true)
    val errorRecovery = ErrorRecovery(logger)
    errorRecovery.handler = mockk<Handler>(relaxed = true)
    val exception = Exception("boom")

    errorRecovery.handleException(exception)

    verify {
      logger.error("ErrorRecovery: exception encountered: boom", exception, UpdatesErrorCode.JSRuntimeError)
    }
  }
}
