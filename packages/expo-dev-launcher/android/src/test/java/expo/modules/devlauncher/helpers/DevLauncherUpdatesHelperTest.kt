package expo.modules.devlauncher.helpers

import android.content.Context
import android.net.Uri
import androidx.test.core.app.ApplicationProvider
import com.google.common.truth.Truth
import expo.modules.updatesinterface.UpdatesInterface
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class DevLauncherUpdatesHelperTest {

  private val context: Context = ApplicationProvider.getApplicationContext()
  private val url = Uri.parse("https://exp.host/@esamelson/sdk42updates")
  private val runtimeVersion = "1.0.0"
  private val configuration = createUpdatesConfigurationWithUrl(url, url, runtimeVersion, null)
  private val mockManifest = JSONObject("{\"icon\":\"./assets/icon.png\",\"name\":\"sdk42updates\",\"slug\":\"sdk42updates\",\"splash\":{\"image\":\"./assets/splash.png\",\"imageUrl\":\"https://classic-assets.eascdn.net/~assets/201a91bd1740bb1d6a1dbad049310724\",\"resizeMode\":\"contain\",\"backgroundColor\":\"#ffffff\"},\"iconUrl\":\"https://classic-assets.eascdn.net/~assets/4e3f888fc8475f69fd5fa32f1ad5216a\",\"version\":\"1.0.0\",\"sdkVersion\":\"42.0.0\",\"orientation\":\"portrait\",\"currentFullName\":\"@esamelson/sdk42updates\",\"originalFullName\":\"@esamelson/sdk42updates\",\"id\":\"@esamelson/sdk42updates\",\"projectId\":\"04e1e9f2-b297-44da-a11c-90a6a27859bc\",\"scopeKey\":\"@esamelson/sdk42updates\",\"releaseId\":\"a2b0a544-40f0-4fd6-9972-19f094380681\",\"publishedTime\":\"2021-07-13T22:29:24.170Z\",\"commitTime\":\"2021-07-13T22:29:24.209Z\",\"bundleUrl\":\"https://classic-assets.eascdn.net/%40esamelson%2Fsdk42updates%2F1.0.0%2F8c3e605420e77ba9fe35a0a7ef8459a9-42.0.0-ios.js\",\"bundleKey\":\"8c3e605420e77ba9fe35a0a7ef8459a9\",\"releaseChannel\":\"default\",\"hostUri\":\"exp.host/@esamelson/sdk42updates\"}")
  private val mockUpdate = object : UpdatesInterface.Update {
    override val manifest: JSONObject = mockManifest
    override val launchAssetPath: String = ""
  }

  @Test
  fun `passes true shouldContinue value through to UpdatesInterface`() = runBlocking<Unit> {
    val updatesInterface = mockUpdatesInterface {
      Truth.assertThat(it).isTrue()
    }
    val loadedUpdate = updatesInterface.loadUpdate(configuration, context) { true }
    Truth.assertThat(loadedUpdate).isEqualTo(mockUpdate)
  }

  @Test
  fun `passes false shouldContinue value through to UpdatesInterface`() = runBlocking<Unit> {
    val updatesInterface = mockUpdatesInterface {
      Truth.assertThat(it).isFalse()
    }
    updatesInterface.loadUpdate(configuration, context) { false }
  }

  private fun mockUpdatesInterface(verifyOnManifestLoadedCallback: (Boolean) -> Unit): UpdatesInterface {
    val updatesInterface = mockk<UpdatesInterface>()
    val slot = slot<UpdatesInterface.UpdateCallback>()
    every {
      updatesInterface.isValidUpdatesConfiguration(any(), any())
    } answers {
      true
    }
    every {
      updatesInterface.fetchUpdateWithConfiguration(any(), any(), capture(slot))
    } answers {
      val callback = slot.captured
      val onManifestLoadedCallbackValue = callback.onManifestLoaded(mockManifest)
      verifyOnManifestLoadedCallback(onManifestLoadedCallbackValue)

      // mock the behavior of the UpdatesDevLauncherController
      if (onManifestLoadedCallbackValue) {
        callback.onSuccess(mockUpdate)
      } else {
        callback.onSuccess(null)
      }
    }
    return updatesInterface
  }

  @Test
  fun `createUpdatesConfiguration sets the correct value for scopeKey`() {
    val urlString1 = "https://exp.host/@test/first-app"
    val url1 = Uri.parse(urlString1)
    val configuration1 = createUpdatesConfigurationWithUrl(url1, url1, runtimeVersion, null)

    val urlString2 = "https://exp.host/@test/second-app"
    val url2 = Uri.parse(urlString2)
    val configuration2 = createUpdatesConfigurationWithUrl(url2, url2, runtimeVersion, null)

    val scopeKey1 = configuration1["scopeKey"]
    val scopeKey2 = configuration2["scopeKey"]
    Truth.assertThat(scopeKey1).isNotEqualTo(scopeKey2)
    Truth.assertThat(scopeKey1).isEqualTo(urlString1)
    Truth.assertThat(scopeKey2).isEqualTo(urlString2)
  }

  @Test
  fun `createUpdatesConfiguration sets the correct scopeKey if projectUrl is different`() {
    val url = Uri.parse("https://u.expo.dev/update/421ba616-9145-4236-8fe8-7be9f2782a30")
    val projectUrlString = "https://u.expo.dev/2f662161-8616-4f16-9f88-911dfb2d3cd6?channel-name=production"
    val configuration = createUpdatesConfigurationWithUrl(url, Uri.parse(projectUrlString), runtimeVersion, "test")

    val configuredUrl = configuration["updateUrl"]
    val configuredScopeKey = configuration["scopeKey"]
    Truth.assertThat(configuredUrl).isNotEqualTo(configuredScopeKey)
    Truth.assertThat(configuredUrl).isEqualTo(url)
    Truth.assertThat(configuredScopeKey).isEqualTo(projectUrlString)
  }

  @Test
  fun `createUpdatesConfiguration sets the correct header for installationID`() {
    val installationID = "test-installation-id"
    val url = Uri.parse("https://exp.host/@test/test")
    val configuration = createUpdatesConfigurationWithUrl(url, url, runtimeVersion, installationID)

    Truth.assertThat((configuration["requestHeaders"] as HashMap<*, *>)["Expo-Dev-Client-ID"]).isEqualTo(installationID)
  }
}
