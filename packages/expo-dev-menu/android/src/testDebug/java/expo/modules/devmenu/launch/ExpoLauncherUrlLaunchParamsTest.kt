package expo.modules.devmenu.launch

import android.net.Uri
import com.google.common.truth.Truth.assertThat
import expo.modules.devmenu.DevMenuPreferences
import io.mockk.mockk
import io.mockk.verify
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class ExpoLauncherUrlLaunchParamsTest {
  private val preferences = mockk<DevMenuPreferences>(relaxed = true)

  @Before
  fun reset() {
    DevMenuLaunchOverrides.reset()
  }

  @Test
  fun `disable fab hides the fab for this process only`() {
    ExpoLauncherUrl(Uri.parse("exp://h:8081?__expo_disable_fab=1")).applyDevMenuLaunchParams(preferences)

    assertThat(DevMenuLaunchOverrides.canShowFab).isFalse()
    assertThat(DevMenuLaunchOverrides.canLaunchDevMenuOnStart).isTrue()
    verify(exactly = 0) { preferences.showFab = any() }
    verify(exactly = 0) { preferences.showsAtLaunch = any() }
    verify(exactly = 0) { preferences.isOnboardingFinished = any() }
  }

  @Test
  fun `disable auto launch keeps the menu closed for this process only`() {
    ExpoLauncherUrl(Uri.parse("exp://h:8081?__expo_disable_auto_launch=1")).applyDevMenuLaunchParams(preferences)

    assertThat(DevMenuLaunchOverrides.canLaunchDevMenuOnStart).isFalse()
    assertThat(DevMenuLaunchOverrides.canShowFab).isTrue()
    verify(exactly = 0) { preferences.showsAtLaunch = any() }
    verify(exactly = 0) { preferences.isOnboardingFinished = any() }
  }

  @Test
  fun `disable onboarding finishes onboarding in the preferences`() {
    ExpoLauncherUrl(Uri.parse("exp://h:8081?__expo_disable_onboarding=1")).applyDevMenuLaunchParams(preferences)

    verify(exactly = 1) { preferences.isOnboardingFinished = true }
    assertThat(DevMenuLaunchOverrides.canShowFab).isTrue()
    assertThat(DevMenuLaunchOverrides.canLaunchDevMenuOnStart).isTrue()
  }

  @Test
  fun `legacy disableFab and disableAutoLaunch are not applied here`() {
    ExpoLauncherUrl(Uri.parse("scheme://expo-development-client/?url=http%3A%2F%2Fh%3A8081&disableFab=1&disableAutoLaunch=1"))
      .applyDevMenuLaunchParams(preferences)

    assertThat(DevMenuLaunchOverrides.canShowFab).isTrue()
    assertThat(DevMenuLaunchOverrides.canLaunchDevMenuOnStart).isTrue()
    verify(exactly = 0) { preferences.showFab = any() }
    verify(exactly = 0) { preferences.showsAtLaunch = any() }
  }

  @Test
  fun `a plain url changes nothing`() {
    ExpoLauncherUrl(Uri.parse("exp://h:8081?x=1")).applyDevMenuLaunchParams(preferences)

    assertThat(DevMenuLaunchOverrides.canShowFab).isTrue()
    assertThat(DevMenuLaunchOverrides.canLaunchDevMenuOnStart).isTrue()
    verify(exactly = 0) { preferences.isOnboardingFinished = any() }
  }
}
