package expo.modules.devlauncher.launcher

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
    Truth.assertThat(registry.getRecentlyOpenedApps().size).isEqualTo(0)
    registry.appWasOpened(urlString, mapOf(), null)
    val apps = registry.getRecentlyOpenedApps()
    Truth.assertThat(apps.size).isEqualTo(1)
    Truth.assertThat(apps[0].url).isEqualTo(urlString)
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
    registry.appWasOpened(urlString, mapOf(), null)

    unmockkAll()

    val apps = registry.getRecentlyOpenedApps()
    Truth.assertThat(apps.size).isEqualTo(0)
  }
}
