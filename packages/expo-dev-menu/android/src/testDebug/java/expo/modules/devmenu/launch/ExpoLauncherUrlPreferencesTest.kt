package expo.modules.devmenu.launch

import android.net.Uri
import expo.modules.devmenu.DevMenuPreferences
import io.mockk.mockk
import io.mockk.verify
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class ExpoLauncherUrlPreferencesTest {
  @Test
  fun `disable fab hides the fab only`() {
    val preferences = mockk<DevMenuPreferences>(relaxed = true)

    ExpoLauncherUrl(Uri.parse("exp://h:8081?__expo_disable_fab=1")).applyDevMenuPreferences(preferences)

    verify(exactly = 1) { preferences.showFab = false }
    verify(exactly = 0) { preferences.showsAtLaunch = any() }
    verify(exactly = 0) { preferences.isOnboardingFinished = any() }
  }

  @Test
  fun `disable auto launch turns off the launch menu and finishes onboarding`() {
    val preferences = mockk<DevMenuPreferences>(relaxed = true)

    ExpoLauncherUrl(Uri.parse("exp://h:8081?__expo_disable_auto_launch=1")).applyDevMenuPreferences(preferences)

    verify(exactly = 1) { preferences.showsAtLaunch = false }
    verify(exactly = 1) { preferences.isOnboardingFinished = true }
    verify(exactly = 0) { preferences.showFab = any() }
  }

  @Test
  fun `disable onboarding finishes onboarding only`() {
    val preferences = mockk<DevMenuPreferences>(relaxed = true)

    ExpoLauncherUrl(Uri.parse("exp://h:8081?__expo_disable_onboarding=1")).applyDevMenuPreferences(preferences)

    verify(exactly = 1) { preferences.isOnboardingFinished = true }
    verify(exactly = 0) { preferences.showFab = any() }
    verify(exactly = 0) { preferences.showsAtLaunch = any() }
  }

  @Test
  fun `legacy names on the legacy host write the same preferences`() {
    val preferences = mockk<DevMenuPreferences>(relaxed = true)

    ExpoLauncherUrl(Uri.parse("scheme://expo-development-client/?url=http%3A%2F%2Fh%3A8081&disableFab=1&disableAutoLaunch=1"))
      .applyDevMenuPreferences(preferences)

    verify(exactly = 1) { preferences.showFab = false }
    verify(exactly = 1) { preferences.showsAtLaunch = false }
    verify(exactly = 1) { preferences.isOnboardingFinished = true }
  }

  @Test
  fun `a plain url writes nothing`() {
    val preferences = mockk<DevMenuPreferences>(relaxed = true)

    ExpoLauncherUrl(Uri.parse("exp://h:8081?x=1")).applyDevMenuPreferences(preferences)

    verify(exactly = 0) { preferences.showFab = any() }
    verify(exactly = 0) { preferences.showsAtLaunch = any() }
    verify(exactly = 0) { preferences.isOnboardingFinished = any() }
  }
}
