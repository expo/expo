package host.exp.exponent.taskManager

import expo.modules.apploader.AppLoaderProvider
import host.exp.exponent.TestApplication
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], application = TestApplication::class)
class ExpoHeadlessAppLoaderTest {
  @Test
  fun appLoaderProviderCreatesTheHeadlessLoader() {
    val loader = AppLoaderProvider.getLoader("react-native-headless", RuntimeEnvironment.getApplication())

    assertTrue(loader is ExpoHeadlessAppLoader)
  }
}
