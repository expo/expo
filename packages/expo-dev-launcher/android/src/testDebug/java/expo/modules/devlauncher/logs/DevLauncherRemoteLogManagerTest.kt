package expo.modules.devlauncher.logs

import android.net.Uri
import com.google.common.truth.Truth
import com.google.gson.JsonParser
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class DevLauncherRemoteLogManagerTest {
  @Test
  fun `dev server URL maps to its hot socket`() {
    val url = DevLauncherRemoteLogManager.webSocketUrl(Uri.parse("http://192.168.1.5:8081"))

    Truth.assertThat(url.toString()).isEqualTo("ws://192.168.1.5:8081/hot")
  }

  @Test
  fun `bundle URL path and query are dropped`() {
    val url = DevLauncherRemoteLogManager.webSocketUrl(
      Uri.parse("http://10.0.2.2:8081/index.bundle?platform=android&dev=true")
    )

    Truth.assertThat(url.toString()).isEqualTo("ws://10.0.2.2:8081/hot")
  }

  @Test
  fun `https tunnel uses a secure socket`() {
    val url = DevLauncherRemoteLogManager.webSocketUrl(Uri.parse("https://abc-anonymous-8081.exp.direct"))

    Truth.assertThat(url.toString()).isEqualTo("wss://abc-anonymous-8081.exp.direct/hot")
  }

  @Test
  fun `EAS Update URL has no dev server`() {
    val url = DevLauncherRemoteLogManager.webSocketUrl(Uri.parse("https://u.expo.dev/abc?channel-name=main"))

    Truth.assertThat(url).isNull()
  }

  @Test
  fun `file URL has no dev server`() {
    val url = DevLauncherRemoteLogManager.webSocketUrl(Uri.parse("file:///data/app/index.android.bundle"))

    Truth.assertThat(url).isNull()
  }

  @Test
  fun `log tags the message as Android`() {
    val json = JsonParser.parseString(DevLauncherRemoteLog(listOf("Failed to load app")).toJson()).asJsonObject

    Truth.assertThat(json.get("type").asString).isEqualTo("log")
    Truth.assertThat(json.get("level").asString).isEqualTo("error")
    Truth.assertThat(json.get("mode").asString).isEqualTo("android")
    Truth.assertThat(json.getAsJsonArray("data").map { it.asString }).containsExactly("Failed to load app")
  }
}
