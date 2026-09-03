package expo.modules.devmenu.launch

import android.net.Uri
import com.google.common.truth.Truth.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class ExpoLaunchUrlTest {
  @Test
  fun `legacy host with url and disableOnboarding`() {
    val raw = "exp+slug://expo-development-client/?url=http%3A%2F%2F10.0.0.5%3A8081&disableOnboarding=1"
    val launch = ExpoLaunchUrl(Uri.parse(raw))

    assertThat(launch.isLauncherCommand).isTrue()
    assertThat(launch.isLegacyHost).isTrue()
    assertThat(launch.targetUrl).isEqualTo(Uri.parse("http://10.0.0.5:8081"))
    assertThat(launch.disablesOnboarding).isTrue()
    assertThat(launch.launchToken).isNull()
    assertThat(launch.suppressesMenuAtLaunch).isFalse()
    assertThat(launch.hidesToolsButton).isFalse()
    // The legacy `url=` form is kept intact so apps and expo-router keep working.
    assertThat(launch.strippedUrl.toString()).isEqualTo(raw)
  }

  @Test
  fun `new shape with every reserved param`() {
    val launch = ExpoLaunchUrl(
      Uri.parse(
        "exp+slug://?__expo_url=http%3A%2F%2F10.0.0.5%3A8081&__expo_launch_token=abc" +
          "&__expo_show_menu_at_launch=0&__expo_tools_button=0&__expo_disable_onboarding=1"
      )
    )

    assertThat(launch.isLauncherCommand).isTrue()
    assertThat(launch.isLegacyHost).isFalse()
    assertThat(launch.targetUrl).isEqualTo(Uri.parse("http://10.0.0.5:8081"))
    assertThat(launch.launchToken).isEqualTo("abc")
    assertThat(launch.suppressesMenuAtLaunch).isTrue()
    assertThat(launch.hidesToolsButton).isTrue()
    assertThat(launch.disablesOnboarding).isTrue()
    assertThat(launch.remainderHasDestination).isFalse()
    assertThat(launch.strippedUrl.query).isNull()
    assertThat(launch.passthroughParams).isEmpty()
  }

  @Test
  fun `app deep link carrying a reserved param`() {
    val launch = ExpoLaunchUrl(Uri.parse("myapp://login?__expo_launch_token=abc&x=1"))

    assertThat(launch.isLauncherCommand).isTrue()
    assertThat(launch.targetUrl).isNull()
    assertThat(launch.launchToken).isEqualTo("abc")
    assertThat(launch.remainderHasDestination).isTrue()
    assertThat(launch.strippedUrl.toString()).isEqualTo("myapp://login?x=1")
    assertThat(launch.passthroughParams).containsExactly("x", "1")
  }

  @Test
  fun `new shape without a destination`() {
    val launch = ExpoLaunchUrl(Uri.parse("myapp://?__expo_url=http%3A%2F%2Flocalhost%3A8081"))

    assertThat(launch.targetUrl).isEqualTo(Uri.parse("http://localhost:8081"))
    assertThat(launch.remainderHasDestination).isFalse()
  }

  @Test
  fun `plain app deep link is not a launcher command`() {
    val raw = "myapp://login?x=1"
    val launch = ExpoLaunchUrl(Uri.parse(raw))

    assertThat(launch.isLauncherCommand).isFalse()
    assertThat(launch.targetUrl).isNull()
    assertThat(launch.strippedUrl.toString()).isEqualTo(raw)
    assertThat(launch.passthroughParams).containsExactly("x", "1")
  }

  @Test
  fun `expo go url keeps the other params`() {
    val launch = ExpoLaunchUrl(Uri.parse("exp://h:8081/--/p?__expo_tools_button=0&x=1"))

    assertThat(launch.isLauncherCommand).isTrue()
    assertThat(launch.hidesToolsButton).isTrue()
    assertThat(launch.targetUrl).isNull()
    assertThat(launch.remainderHasDestination).isTrue()
    assertThat(launch.strippedUrl.toString()).isEqualTo("exp://h:8081/--/p?x=1")
  }

  @Test
  fun `params inside the target url are ignored`() {
    val launch = ExpoLaunchUrl(
      Uri.parse("exp+slug://?__expo_url=http%3A%2F%2Flocalhost%3A8081%2F%3F__expo_tools_button%3D0")
    )

    assertThat(launch.hidesToolsButton).isFalse()
    assertThat(launch.targetUrl).isEqualTo(Uri.parse("http://localhost:8081/?__expo_tools_button=0"))
  }

  @Test
  fun `only exact values act`() {
    val launch = ExpoLaunchUrl(
      Uri.parse("exp://h:8081?__expo_show_menu_at_launch=1&__expo_tools_button=false&__expo_disable_onboarding=true")
    )

    assertThat(launch.isLauncherCommand).isTrue()
    assertThat(launch.suppressesMenuAtLaunch).isFalse()
    assertThat(launch.hidesToolsButton).isFalse()
    assertThat(launch.disablesOnboarding).isFalse()
    assertThat(launch.strippedUrl.query).isNull()
  }

  @Test
  fun `unknown reserved params are stripped`() {
    val launch = ExpoLaunchUrl(Uri.parse("exp://h:8081?__expo_foo=1&x=1"))

    assertThat(launch.isLauncherCommand).isTrue()
    assertThat(launch.strippedUrl.toString()).isEqualTo("exp://h:8081?x=1")
  }

  @Test
  fun `legacy aliases only apply on the legacy host`() {
    val raw = "exp://h:8081?disableOnboarding=1&url=http%3A%2F%2Fother"
    val launch = ExpoLaunchUrl(Uri.parse(raw))

    assertThat(launch.isLauncherCommand).isFalse()
    assertThat(launch.disablesOnboarding).isFalse()
    assertThat(launch.targetUrl).isNull()
    assertThat(launch.strippedUrl.toString()).isEqualTo(raw)
  }

  @Test
  fun `opaque uri does not throw`() {
    val launch = ExpoLaunchUrl(Uri.parse("mailto:a@b.c"))

    assertThat(launch.isLauncherCommand).isFalse()
    assertThat(launch.targetUrl).isNull()
    assertThat(launch.strippedUrl.toString()).isEqualTo("mailto:a@b.c")
  }

  @Test
  fun `preserves percent encoding of the other params`() {
    val launch = ExpoLaunchUrl(Uri.parse("exp://h:8081/?snack-channel=a%2Bb&__expo_tools_button=0"))

    assertThat(launch.strippedUrl.toString()).isEqualTo("exp://h:8081/?snack-channel=a%2Bb")
  }

  @Test
  fun `empty launch token is null`() {
    val launch = ExpoLaunchUrl(Uri.parse("exp://h:8081?__expo_launch_token="))

    assertThat(launch.launchToken).isNull()
  }
}
