package expo.modules.devlauncher.modules

import android.net.Uri
import com.facebook.react.bridge.ReactApplicationContext
import com.google.common.truth.Truth
import expo.modules.devlauncher.koin.DevLauncherKoinContext
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import io.mockk.every
import io.mockk.mockk
import org.junit.Test
import org.junit.runner.RunWith
import org.koin.dsl.module
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class DevLauncherModuleTest {

  @Test
  fun `exports manifestURL for currently loaded app`() {
    // used by snack

    val urlString = "https://exp.host/@test/test?query=param"
    val manifestURL = Uri.parse(urlString)

    val devLauncherController = mockk<DevLauncherControllerInterface>(relaxed = true)
    DevLauncherKoinContext.app.koin.loadModules(
      listOf(
        module {
          single { devLauncherController }
        }
      )
    )
    every { devLauncherController.manifestURL } returns manifestURL

    val reactApplicationContext = mockk<ReactApplicationContext>(relaxed = true)
    val module = DevLauncherModule(reactApplicationContext)
    val constants = module.constants
    Truth.assertThat(constants["manifestURL"]).isEqualTo(urlString)
  }
}
