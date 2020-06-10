package expo.modules.template

import io.mockk.mockk
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.unimodules.test.core.PromiseMock
import org.unimodules.test.core.moduleRegistryMock

@RunWith(RobolectricTestRunner::class)
class ModuleTemplateModuleTest {

  private var moduleRegistry = moduleRegistryMock()

  private lateinit var promise: PromiseMock

  private lateinit var module: ModuleTemplateModule

  @Before
  fun initializeMock() {
    promise = PromiseMock()
    module = ModuleTemplateModule(mockk())
  }

  @Test
  fun testSomeGreatMethodAsync() {
    assertTrue(true)
  }

}
