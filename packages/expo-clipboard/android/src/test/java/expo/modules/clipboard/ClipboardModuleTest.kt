package expo.modules.clipboard

import androidx.test.core.app.ApplicationProvider

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.unimodules.test.core.PromiseMock
import org.unimodules.test.core.assertResolved

@RunWith(RobolectricTestRunner::class)
class ClipboardModuleTest {

  private lateinit var module: ClipboardModule

  @Before
  fun initializeMock() {
    module = ClipboardModule(ApplicationProvider.getApplicationContext())
  }

  @Test
  fun setAndGetString() {
    var promise1 = PromiseMock()
    module.setString("albus dumbledore", promise1)
    assertResolved(promise1)
    assertNull(promise1.resolveValue)

    var promise2 = PromiseMock()
    module.getStringAsync(promise2)
    assertResolved(promise2)
    assertEquals("albus dumbledore", promise2.resolveValue)
  }
}
