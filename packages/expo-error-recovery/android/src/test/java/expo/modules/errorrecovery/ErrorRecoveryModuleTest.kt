package expo.modules.errorrecovery

import androidx.test.core.app.ApplicationProvider
import io.mockk.mockk
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.Assert.assertEquals
import org.robolectric.RobolectricTestRunner
import org.unimodules.test.core.PromiseMock
import org.unimodules.test.core.assertResolved
import org.unimodules.test.core.mockPromise

@RunWith(RobolectricTestRunner::class)
internal class ErrorRecoveryModuleTest {

  private lateinit var module: ErrorRecoveryModule

  @Before
  fun initializeMock() {
    module = ErrorRecoveryModule(ApplicationProvider.getApplicationContext())
  }

  @Test
  fun `saveRecoveryProps should resolve provided promise when props=null`() {
    val promise = PromiseMock()
    module.saveRecoveryProps(null, promise)
    assertResolved(promise)
  }

  @Test
  fun `saveRecoveryProps should resolve provided promise`() {
    val promise = PromiseMock()
    module.saveRecoveryProps("coding is fun they said", promise)
    assertResolved(promise)
  }
}
