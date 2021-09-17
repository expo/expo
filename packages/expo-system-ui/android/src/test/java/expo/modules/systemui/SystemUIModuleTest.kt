package expo.modules.systemui

import io.mockk.mockk
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.unimodules.test.core.PromiseMock
import org.unimodules.test.core.moduleRegistryMock

@RunWith(RobolectricTestRunner::class)
class SystemUIModuleTest {

  private var moduleRegistry = moduleRegistryMock()

  private lateinit var promise: PromiseMock

  private lateinit var module: SystemUIModule

  @Before
  fun initializeMock() {
    promise = PromiseMock()
    module = SystemUIModule(mockk())
  }

  @Test
  fun testSetNavigationBarColor() {
    // TODO: Test
    assertTrue(true)
  }
}
