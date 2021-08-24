package expo.modules.application

import androidx.test.core.app.ApplicationProvider
import expo.modules.core.ModuleRegistry
import expo.modules.core.interfaces.ActivityProvider

import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.Assert.assertTrue
import org.robolectric.RobolectricTestRunner

import org.unimodules.test.core.PromiseMock
import org.unimodules.test.core.assertResolved
import org.unimodules.test.core.mockInternalModule
import org.unimodules.test.core.mockkInternalModule
import org.unimodules.test.core.moduleRegistryMock

@RunWith(RobolectricTestRunner::class)
internal class ApplicationModuleTest {
  private lateinit var applicationModule: ApplicationModule
  private lateinit var moduleRegistry: ModuleRegistry

  @Before
  fun initializeTest() {
    applicationModule = ApplicationModule(ApplicationProvider.getApplicationContext())
    val mockActivityProvider = mockkInternalModule<MockActivityProvider>(
      relaxed = true,
      asInterface = ActivityProvider::class.java
    )
    moduleRegistry = moduleRegistryMock()
    moduleRegistry.mockInternalModule(mockActivityProvider)
    applicationModule.onCreate(moduleRegistry)
  }

  @Test
  fun `getConstants returns map with all the keys specified in doc`() { // https://docs.expo.dev/versions/latest/sdk/application/
    val constants = applicationModule.constants
    assertTrue("Returned hash map does not contain \"applicationName\" key", constants.containsKey("applicationName"))
    assertTrue("Returned hash map does not contain \"applicationId\" key", constants.containsKey("applicationId"))
    assertTrue("Returned hash map does not contain \"nativeApplicationVersion\" key", constants.containsKey("nativeApplicationVersion"))
    assertTrue("Returned hash map does not contain \"nativeBuildVersion\" key", constants.containsKey("nativeBuildVersion"))
    assertTrue("Returned hash map does not contain \"androidId\" key", constants.containsKey("androidId"))
  }

  @Test
  fun `getInstallationTimeAsync resolves promise (valid package name)`() {
    val promise = PromiseMock()
    applicationModule.getInstallationTimeAsync(promise)
    assertResolved(promise)
  }

  @Test
  fun `getLastUpdateTimeAsync resolves promise (valid package name)`() {
    val promise = PromiseMock()
    applicationModule.getLastUpdateTimeAsync(promise)
    assertResolved(promise)
  }
}
