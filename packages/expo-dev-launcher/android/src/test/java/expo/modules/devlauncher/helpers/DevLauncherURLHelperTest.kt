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
  fun `tests isDevLauncherUrl accepts reserved params on any host`() {
    Truth.assertThat(isDevLauncherUrl(Uri.parse("myapp://login?__expo_launch_token=abc"))).isTrue()
    Truth.assertThat(isDevLauncherUrl(Uri.parse("myapp://?__expo_url=http%3A%2F%2Flocalhost%3A8081"))).isTrue()
    Truth.assertThat(isDevLauncherUrl(Uri.parse("myapp://login"))).isFalse()
  }

  @Test
  fun `tests hasUrlQueryParam`() {
    Truth.assertThat(hasUrlQueryParam(Uri.parse("exp://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"))).isTrue()
    Truth.assertThat(hasUrlQueryParam(Uri.parse("myapp://?__expo_url=http%3A%2F%2Flocalhost%3A8081"))).isTrue()
    Truth.assertThat(hasUrlQueryParam(Uri.parse("exp://expo-development-client"))).isFalse()
    Truth.assertThat(hasUrlQueryParam(Uri.parse("myapp://login?__expo_launch_token=abc"))).isFalse()
  }

  @Test
  fun `tests DevLauncherUrl resolves the target and drops reserved params`() {
    val legacy = DevLauncherUrl(
      Uri.parse("scheme://expo-development-client/?url=exp%3A%2F%2Flocalhost%3A8081&updateMessage=hi&__expo_launch_token=abc")
    )
    Truth.assertThat(legacy.url.toString()).isEqualTo("http://localhost:8081")
    Truth.assertThat(legacy.queryParams["updateMessage"]).isEqualTo("hi")
    Truth.assertThat(legacy.queryParams).doesNotContainKey("__expo_launch_token")

    val reserved = DevLauncherUrl(
      Uri.parse("scheme://?__expo_url=exp%3A%2F%2Flocalhost%3A8081&__expo_tools_button=0")
    )
    Truth.assertThat(reserved.url.toString()).isEqualTo("http://localhost:8081")
    Truth.assertThat(reserved.queryParams).isEmpty()

    val plain = DevLauncherUrl(Uri.parse("exp://localhost:8081?x=1"))
    Truth.assertThat(plain.url.toString()).isEqualTo("http://localhost:8081?x=1")
    Truth.assertThat(plain.queryParams["x"]).isEqualTo("1")
  }
}
