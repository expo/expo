package expo.modules.devlauncher.launcher

import android.net.Uri
import androidx.test.core.app.ApplicationProvider
import com.google.common.truth.Truth
import io.mockk.every
import io.mockk.mockkObject
import io.mockk.unmockkAll
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class DevLauncherRecentlyOpenedAppsRegistryTest {
  @Test
  fun `adds app to registry`() {
    val urlString = "http://localhost:8081"
    val registry = DevLauncherRecentlyOpenedAppsRegistry(ApplicationProvider.getApplicationContext())
    registry.appWasOpened(Uri.parse(urlString), "test-app")
    val apps = registry.getRecentlyOpenedApps()
    Truth.assertThat(apps[urlString]).isEqualTo("test-app")
  }

  @Test
  fun `removes app from registry after 3 days have elapsed`() {
    val currentTime = System.currentTimeMillis()
    val time3DaysAnd1SecondAgo = currentTime - ((1000 * 60 * 60 * 24 * 3) + 1000)

    mockkObject(DevLauncherRecentlyOpenedAppsRegistry.TimeHelper)
    every {
      DevLauncherRecentlyOpenedAppsRegistry.TimeHelper.getCurrentTime()
    } returns time3DaysAnd1SecondAgo

    val urlString = "http://localhost:8081"
    val registry = DevLauncherRecentlyOpenedAppsRegistry(ApplicationProvider.getApplicationContext())
    registry.appWasOpened(Uri.parse(urlString), "test-app")

    unmockkAll()

    val apps = registry.getRecentlyOpenedApps()
    Truth.assertThat(apps[urlString]).isNull()
  }
}
