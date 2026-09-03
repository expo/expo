package expo.modules.devmenu

import android.net.Uri
import com.google.common.truth.Truth.assertThat
import expo.modules.devmenu.launch.ExpoLaunchUrl
import io.mockk.mockk
import io.mockk.verify
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class DevMenuLaunchOverridesTest {
  @Before
  fun reset() {
    DevMenuLaunchOverrides.reset()
  }

  @Test
  fun `show menu at launch 0 disables the auto launch only`() {
    DevMenuLaunchOverrides.apply(ExpoLaunchUrl(Uri.parse("exp://h:8081?__expo_show_menu_at_launch=0")), null)

    assertThat(DevMenuLaunchOverrides.canLaunchDevMenuOnStart).isFalse()
    assertThat(DevMenuLaunchOverrides.canShowFab).isTrue()
  }

  @Test
  fun `tools button 0 hides the fab only`() {
    DevMenuLaunchOverrides.apply(ExpoLaunchUrl(Uri.parse("exp://h:8081?__expo_tools_button=0")), null)

    assertThat(DevMenuLaunchOverrides.canLaunchDevMenuOnStart).isTrue()
    assertThat(DevMenuLaunchOverrides.canShowFab).isFalse()
  }

  @Test
  fun `overrides are sticky for the process`() {
    DevMenuLaunchOverrides.apply(ExpoLaunchUrl(Uri.parse("exp://h:8081?__expo_show_menu_at_launch=0")), null)
    DevMenuLaunchOverrides.apply(ExpoLaunchUrl(Uri.parse("exp://h:8081")), null)

    assertThat(DevMenuLaunchOverrides.canLaunchDevMenuOnStart).isFalse()
  }

  @Test
  fun `disable onboarding writes the preference`() {
    val preferences = mockk<DevMenuPreferences>(relaxed = true)

    DevMenuLaunchOverrides.apply(ExpoLaunchUrl(Uri.parse("exp://h:8081?__expo_disable_onboarding=1")), preferences)

    verify(exactly = 1) { preferences.isOnboardingFinished = true }
  }

  @Test
  fun `other params do not touch the preferences`() {
    val preferences = mockk<DevMenuPreferences>(relaxed = true)

    DevMenuLaunchOverrides.apply(ExpoLaunchUrl(Uri.parse("exp://h:8081?__expo_show_menu_at_launch=0")), preferences)

    verify(exactly = 0) { preferences.isOnboardingFinished = any() }
    verify(exactly = 0) { preferences.showsAtLaunch = any() }
    verify(exactly = 0) { preferences.showFab = any() }
  }

  @Test
  fun `null preferences are tolerated`() {
    DevMenuLaunchOverrides.apply(ExpoLaunchUrl(Uri.parse("exp://h:8081?__expo_disable_onboarding=1")), null)
  }
}
