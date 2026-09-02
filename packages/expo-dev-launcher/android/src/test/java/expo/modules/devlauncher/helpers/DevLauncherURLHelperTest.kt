package expo.modules.devlauncher.helpers

import android.net.Uri
import com.google.common.truth.Truth
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class DevLauncherURLHelperTest {
  @Test
  fun `tests changeUrlScheme`() {
    val expoUri = Uri.parse("exp://localhost:1999")
    val httpsUri = Uri.parse("https://google.com")
    val uriWithPath = Uri.parse("https://expo.io/path")

    val expoParsedUri = replaceEXPScheme(expoUri, "http")
    val httpsParsedUri = replaceEXPScheme(httpsUri, "http")
    val parsedUriWithPath = replaceEXPScheme(uriWithPath, "http")

    Truth.assertThat(expoParsedUri.scheme).isEqualTo("http")
    Truth.assertThat(expoParsedUri.host).isEqualTo("localhost")
    Truth.assertThat(expoParsedUri.port).isEqualTo(1999)

    Truth.assertThat(httpsParsedUri.scheme).isEqualTo("https")
    Truth.assertThat(httpsParsedUri.host).isEqualTo("google.com")

    Truth.assertThat(parsedUriWithPath.scheme).isEqualTo("https")
    Truth.assertThat(parsedUriWithPath.host).isEqualTo("expo.io")
    Truth.assertThat(parsedUriWithPath.path).isEqualTo("/path")
  }

  @Test
  fun `tests isDevLauncherUrl`() {
    Truth.assertThat(
      isDevLauncherUrl(
        Uri.parse("exp://expo-development-client")
      )
    ).isTrue()

    Truth.assertThat(
      isDevLauncherUrl(
        Uri.parse("exp://not-expo-development-client")
      )
    ).isFalse()
  }

  @Test
  fun `tests hasEnabledFlag`() {
    val devLauncherUrl = "exp://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081&disableFab=1"

    Truth.assertThat(hasEnabledFlag(Uri.parse(devLauncherUrl), "disableFab")).isTrue()
    Truth.assertThat(hasEnabledFlag(Uri.parse("http://localhost:8081?disableAutoLaunch=1"), "disableAutoLaunch")).isTrue()

    Truth.assertThat(hasEnabledFlag(Uri.parse(devLauncherUrl), "disableAutoLaunch")).isFalse()
    Truth.assertThat(hasEnabledFlag(Uri.parse("http://localhost:8081?disableFab=0"), "disableFab")).isFalse()
    Truth.assertThat(hasEnabledFlag(Uri.parse("http://localhost:8081?disableFab"), "disableFab")).isFalse()

    val urlWithFlagInAppUrl = "exp://expo-development-client/?url=" +
      Uri.encode("http://localhost:8081?disableFab=1")
    Truth.assertThat(hasEnabledFlag(Uri.parse(urlWithFlagInAppUrl), "disableFab")).isFalse()
  }
}
