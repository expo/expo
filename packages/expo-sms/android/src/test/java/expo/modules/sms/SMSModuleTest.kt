package expo.modules.sms

import androidx.test.core.app.ApplicationProvider
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.unimodules.test.core.PromiseMock
import org.unimodules.test.core.assertResolved


@RunWith(RobolectricTestRunner::class)
internal class SMSModuleTest {

  private lateinit var module: SMSModule

  @Before
  fun initializeMock() {
    module = SMSModule(ApplicationProvider.getApplicationContext())
  }

  @Test
  fun `isAvailableAsync should resolve`() {
    var promise = PromiseMock()
    module.isAvailableAsync(promise)
    assertResolved(promise)
  }
}


