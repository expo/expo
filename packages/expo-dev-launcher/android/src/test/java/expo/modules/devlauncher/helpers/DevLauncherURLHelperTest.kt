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
}
