package expo.modules.devmenu.launch

import android.net.Uri
import com.google.common.truth.Truth.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class ExpoLauncherUrlTest {
  @Test
  fun `legacy host with url and disableOnboarding`() {
    val raw = "exp+slug://expo-development-client/?url=http%3A%2F%2F10.0.0.5%3A8081&disableOnboarding=1"
    val launch = ExpoLauncherUrl(Uri.parse(raw))

    assertThat(launch.isLauncherCommand).isTrue()
    assertThat(launch.isLegacyHost).isTrue()
    assertThat(launch.targetUrl).isEqualTo(Uri.parse("http://10.0.0.5:8081"))
    assertThat(launch.disablesOnboarding).isTrue()
    assertThat(launch.disablesFab).isFalse()
    assertThat(launch.disablesAutoLaunch).isFalse()
    // The legacy `url=` form is kept intact so apps and expo-router keep working.
    assertThat(launch.strippedUrl.toString()).isEqualTo(raw)
  }

  @Test
  fun `new shape with every reserved param`() {
    val launch = ExpoLauncherUrl(
      Uri.parse(
        "exp+slug://?__expo_url=http%3A%2F%2F10.0.0.5%3A8081" +
          "&__expo_disable_fab=1&__expo_disable_auto_launch=1&__expo_disable_onboarding=1"
      )
    )

    assertThat(launch.isLauncherCommand).isTrue()
    assertThat(launch.isLegacyHost).isFalse()
    assertThat(launch.targetUrl).isEqualTo(Uri.parse("http://10.0.0.5:8081"))
    assertThat(launch.disablesFab).isTrue()
    assertThat(launch.disablesAutoLaunch).isTrue()
    assertThat(launch.disablesOnboarding).isTrue()
    assertThat(launch.remainderHasDestination).isFalse()
    assertThat(launch.strippedUrl.query).isNull()
    assertThat(launch.passthroughParams).isEmpty()
  }

  @Test
  fun `app deep link carrying a reserved param`() {
    val launch = ExpoLauncherUrl(Uri.parse("myapp://login?__expo_disable_fab=1&x=1"))

    assertThat(launch.isLauncherCommand).isTrue()
    assertThat(launch.targetUrl).isNull()
    assertThat(launch.disablesFab).isTrue()
    assertThat(launch.remainderHasDestination).isTrue()
    assertThat(launch.strippedUrl.toString()).isEqualTo("myapp://login?x=1")
    assertThat(launch.passthroughParams).containsExactly("x", "1")
  }

  @Test
  fun `new shape without a destination`() {
    val launch = ExpoLauncherUrl(Uri.parse("myapp://?__expo_url=http%3A%2F%2Flocalhost%3A8081"))

    assertThat(launch.targetUrl).isEqualTo(Uri.parse("http://localhost:8081"))
    assertThat(launch.remainderHasDestination).isFalse()
  }

  @Test
  fun `plain app deep link is not a launcher command`() {
    val raw = "myapp://login?x=1"
    val launch = ExpoLauncherUrl(Uri.parse(raw))

    assertThat(launch.isLauncherCommand).isFalse()
    assertThat(launch.targetUrl).isNull()
    assertThat(launch.strippedUrl.toString()).isEqualTo(raw)
    assertThat(launch.passthroughParams).containsExactly("x", "1")
  }

  @Test
  fun `expo go url keeps the other params`() {
    val launch = ExpoLauncherUrl(Uri.parse("exp://h:8081/--/p?__expo_disable_fab=1&x=1"))

    assertThat(launch.isLauncherCommand).isTrue()
    assertThat(launch.disablesFab).isTrue()
    assertThat(launch.targetUrl).isNull()
    assertThat(launch.remainderHasDestination).isTrue()
    assertThat(launch.strippedUrl.toString()).isEqualTo("exp://h:8081/--/p?x=1")
  }

  @Test
  fun `params inside the target url are ignored`() {
    val launch = ExpoLauncherUrl(
      Uri.parse("exp+slug://?__expo_url=http%3A%2F%2Flocalhost%3A8081%2F%3F__expo_disable_fab%3D1")
    )

    assertThat(launch.disablesFab).isFalse()
    assertThat(launch.targetUrl).isEqualTo(Uri.parse("http://localhost:8081/?__expo_disable_fab=1"))
  }

  @Test
  fun `only exact values act`() {
    val launch = ExpoLauncherUrl(
      Uri.parse("exp://h:8081?__expo_disable_fab=0&__expo_disable_auto_launch=true&__expo_disable_onboarding=yes")
    )

    assertThat(launch.isLauncherCommand).isTrue()
    assertThat(launch.disablesFab).isFalse()
    assertThat(launch.disablesAutoLaunch).isFalse()
    assertThat(launch.disablesOnboarding).isFalse()
    assertThat(launch.strippedUrl.query).isNull()
  }

  @Test
  fun `unknown reserved params are stripped`() {
    val launch = ExpoLauncherUrl(Uri.parse("exp://h:8081?__expo_foo=1&x=1"))

    assertThat(launch.isLauncherCommand).isTrue()
    assertThat(launch.strippedUrl.toString()).isEqualTo("exp://h:8081?x=1")
  }

  @Test
  fun `legacy aliases only apply on the legacy host`() {
    val raw = "exp://h:8081?disableOnboarding=1&disableFab=1&disableAutoLaunch=1&url=http%3A%2F%2Fother"
    val launch = ExpoLauncherUrl(Uri.parse(raw))

    assertThat(launch.isLauncherCommand).isFalse()
    assertThat(launch.disablesOnboarding).isFalse()
    assertThat(launch.disablesFab).isFalse()
    assertThat(launch.disablesAutoLaunch).isFalse()
    assertThat(launch.targetUrl).isNull()
    assertThat(launch.strippedUrl.toString()).isEqualTo(raw)
  }

  @Test
  fun `legacy host with url only`() {
    val raw = "exp+slug://expo-development-client/?url=http%3A%2F%2F10.0.0.5%3A8081"
    val launch = ExpoLauncherUrl(Uri.parse(raw))

    assertThat(launch.isLauncherCommand).isTrue()
    assertThat(launch.isLegacyHost).isTrue()
    assertThat(launch.targetUrl).isEqualTo(Uri.parse("http://10.0.0.5:8081"))
    assertThat(launch.disablesOnboarding).isFalse()
    assertThat(launch.disablesFab).isFalse()
    assertThat(launch.disablesAutoLaunch).isFalse()
    assertThat(launch.strippedUrl.toString()).isEqualTo(raw)
    assertThat(launch.passthroughParams).containsExactly("url", "http://10.0.0.5:8081")
  }

  @Test
  fun `legacy disableFab and disableAutoLaunch are left to the launcher`() {
    val launch = ExpoLauncherUrl(
      Uri.parse("exp+slug://expo-development-client/?url=http%3A%2F%2F10.0.0.5%3A8081&disableFab=1&disableAutoLaunch=1")
    )

    assertThat(launch.disablesFab).isFalse()
    assertThat(launch.disablesAutoLaunch).isFalse()
    assertThat(launch.passthroughParams).containsEntry("disableFab", "1")
  }

  @Test
  fun `opaque uri does not throw`() {
    val launch = ExpoLauncherUrl(Uri.parse("mailto:a@b.c"))

    assertThat(launch.isLauncherCommand).isFalse()
    assertThat(launch.targetUrl).isNull()
    assertThat(launch.strippedUrl.toString()).isEqualTo("mailto:a@b.c")
  }

  @Test
  fun `preserves percent encoding of the other params`() {
    val launch = ExpoLauncherUrl(Uri.parse("exp://h:8081/?snack-channel=a%2Bb&__expo_disable_fab=1"))

    assertThat(launch.strippedUrl.toString()).isEqualTo("exp://h:8081/?snack-channel=a%2Bb")
  }
}
