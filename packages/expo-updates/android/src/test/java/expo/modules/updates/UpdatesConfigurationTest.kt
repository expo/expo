package expo.modules.updates

import android.net.Uri
import com.google.common.truth.Truth
import io.mockk.every
import io.mockk.mockk
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class UpdatesConfigurationTest {
  @Test
  fun `getNormalizedUrlOrigin should support known scheme with unknown port number`() {
    val mockedUri = mockk<Uri>()
    every { mockedUri.scheme } returns "https"
    every { mockedUri.host } returns "exp.host"
    every { mockedUri.port } returns -1
    Truth.assertThat(getNormalizedUrlOrigin(mockedUri)).isEqualTo("https://exp.host")
  }

  @Test
  fun `getNormalizedUrlOrigin should support known scheme with explicit default port number`() {
    val mockedUri = mockk<Uri>()
    every { mockedUri.scheme } returns "https"
    every { mockedUri.host } returns "exp.host"
    every { mockedUri.port } returns 443
    Truth.assertThat(getNormalizedUrlOrigin(mockedUri)).isEqualTo("https://exp.host")
  }

  @Test
  fun `getNormalizedUrlOrigin should support known scheme with explicit non-default port number`() {
    val mockedUri = mockk<Uri>()
    every { mockedUri.scheme } returns "https"
    every { mockedUri.host } returns "exp.host"
    every { mockedUri.port } returns 47
    Truth.assertThat(getNormalizedUrlOrigin(mockedUri)).isEqualTo("https://exp.host:47")
  }

  @Test
  fun `isValidRequestHeadersOverride should return true for headers matched with embedded headers`() {
    val originalEmbeddedRequestHeaders = mapOf(
      "expo-channel-name" to "default"
    )
    val requestHeadersOverride = mapOf(
      "Expo-Channel-Name" to "preview"
    )
    Truth.assertThat(
      UpdatesConfiguration.isValidRequestHeadersOverride(
        originalEmbeddedRequestHeaders = originalEmbeddedRequestHeaders,
        requestHeadersOverride = requestHeadersOverride
      )
    ).isTrue()
  }

  @Test
  fun `isValidRequestHeadersOverride should return false for headers unmatched with embedded headers`() {
    val originalEmbeddedRequestHeaders = mapOf(
      "expo-channel-name" to "default"
    )
    val requestHeadersOverride = mapOf(
      "Expo-Channel-Name" to "preview",
      "X-Custom" to "custom"
    )
    Truth.assertThat(
      UpdatesConfiguration.isValidRequestHeadersOverride(
        originalEmbeddedRequestHeaders = originalEmbeddedRequestHeaders,
        requestHeadersOverride = requestHeadersOverride
      )
    ).isFalse()
  }

  @Test
  fun `isValidRequestHeadersOverride should return false for Host override header`() {
    val originalEmbeddedRequestHeaders = mapOf(
      "expo-channel-name" to "default",
      "Host" to "example.org"
    )
    val requestHeadersOverride = mapOf(
      "Expo-Channel-Name" to "preview",
      "Host" to "override.org"
    )
    Truth.assertThat(
      UpdatesConfiguration.isValidRequestHeadersOverride(
        originalEmbeddedRequestHeaders = originalEmbeddedRequestHeaders,
        requestHeadersOverride = requestHeadersOverride
      )
    ).isFalse()
  }

  @Test
  fun `isValidRequestHeadersOverride should handle Host override header normalization`() {
    val originalEmbeddedRequestHeaders = mapOf(
      "expo-channel-name" to "default",
      " Host " to "example.org"
    )
    val requestHeadersOverride = mapOf(
      "Expo-Channel-Name" to "preview",
      " Host " to "override.org"
    )
    Truth.assertThat(
      UpdatesConfiguration.isValidRequestHeadersOverride(
        originalEmbeddedRequestHeaders = originalEmbeddedRequestHeaders,
        requestHeadersOverride = requestHeadersOverride
      )
    ).isFalse()
  }
}
