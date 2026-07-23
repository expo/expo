package expo.modules.devlauncher.launcher.loaders

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.facebook.react.ReactActivity
import com.facebook.react.ReactHost
import com.facebook.react.bridge.ReactContext
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class DevLauncherAppLoaderTest {
  private val context: Context = ApplicationProvider.getApplicationContext()
  private val controller = mockk<DevLauncherControllerInterface>(relaxed = true)

  @Test
  fun `reloads an existing React context before loading the selected app`() {
    val existingReactContext = mockk<ReactContext>()
    val appHost = mockk<ReactHost>(relaxed = true)
    every { appHost.currentReactContext } returns existingReactContext
    val activity = mockk<ReactActivity>(relaxed = true)
    val appLoader = object : DevLauncherAppLoader(appHost, context, controller) {
      override fun injectBundleLoader() = true
    }

    appLoader.createOnDelegateWillBeCreatedListener()(activity)

    verify(exactly = 1) {
      appHost.reload("DevLauncher replacing existing React context")
    }
  }
}
