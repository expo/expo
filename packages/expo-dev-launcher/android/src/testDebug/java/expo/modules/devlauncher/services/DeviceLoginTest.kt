package expo.modules.devlauncher.services

import android.net.Uri
import com.google.common.truth.Truth
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class DeviceLoginTest {
  // The parameter names are spelled out: these are the literals Expo CLI and Expo Orbit send.
  @Test
  fun `reads the device code, match value and client ID next to a project URL`() {
    val uri = Uri.parse("exp+app://?__expo_url=http%3A%2F%2Flocalhost%3A8081&__expo_device_code=abc&__expo_device_match=42&__expo_device_client=expo-go")

    Truth.assertThat(DeviceLoginRequest.parse(uri))
      .isEqualTo(DeviceLoginRequest(deviceCode = "abc", matchValue = "42", clientId = "expo-go"))
  }

  @Test
  fun `rejects a URL with a missing or empty param`() {
    listOf(
      "exp+app://?__expo_url=http%3A%2F%2Flocalhost%3A8081",
      "exp+app://?__expo_device_match=42&__expo_device_client=expo-go",
      "exp+app://?__expo_device_code=abc&__expo_device_client=expo-go",
      "exp+app://?__expo_device_code=abc&__expo_device_match=42",
      "exp+app://?__expo_device_code=&__expo_device_match=42&__expo_device_client=expo-go",
      "mailto:someone@example.com"
    ).forEach {
      Truth.assertThat(DeviceLoginRequest.parse(Uri.parse(it))).isNull()
    }
  }
}
