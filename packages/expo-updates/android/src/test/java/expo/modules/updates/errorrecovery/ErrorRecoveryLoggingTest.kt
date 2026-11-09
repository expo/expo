package expo.modules.updates.errorrecovery

import android.os.Handler
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updatesinterface.UpdatesLogMessage
import io.mockk.mockk
import io.mockk.verify
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ErrorRecoveryLoggingTest {
  @Test
  fun `logs a handled exception with the JS exception key and its message`() {
    val logger = mockk<UpdatesLogger>(relaxed = true)
    val errorRecovery = ErrorRecovery(logger)
    errorRecovery.handler = mockk<Handler>(relaxed = true)
    val exception = Exception("boom")

    errorRecovery.handleException(exception)

    verify {
      logger.error(UpdatesLogMessage.ErrorRecoveryJsException, exception, mapOf("error" to "boom"))
    }
  }
}
