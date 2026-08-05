package expo.modules.devlauncher.modules

import android.net.Uri
import com.facebook.react.bridge.ReactApplicationContext
import com.google.common.truth.Truth
import expo.modules.devlauncher.DevLauncherController
import io.mockk.every
import io.mockk.mockk
import org.junit.After
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class DevLauncherModuleTest {

  @After
  fun teardown() {
    DevLauncherController.nullableInstance = null
  }

  @Test
  fun `exports manifestURL for currently loaded app`() {
    // used by snack

    val urlString = "https://exp.host/@test/test?query=param"
    val manifestURL = Uri.parse(urlString)

    val controller = mockk<DevLauncherController>(relaxed = true)
    every { controller.manifestURL } returns manifestURL
    DevLauncherController.nullableInstance = controller

    val reactApplicationContext = mockk<ReactApplicationContext>(relaxed = true)
    val module = DevLauncherModule(reactApplicationContext)
    val constants = module.constants
    Truth.assertThat(constants["manifestURL"]).isEqualTo(urlString)
  }
}
