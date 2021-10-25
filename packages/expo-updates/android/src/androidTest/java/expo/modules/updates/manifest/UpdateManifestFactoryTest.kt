package expo.modules.updates.manifest

import android.net.Uri
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.manifest.ManifestFactory.getEmbeddedManifest
import expo.modules.updates.manifest.ManifestFactory.getManifest
import io.mockk.every
import io.mockk.mockk
import org.json.JSONException
import org.json.JSONObject
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import java.util.*

@RunWith(AndroidJUnit4ClassRunner::class)
class UpdateManifestFactoryTest {
  private val legacyManifestJson =
    "{\"sdkVersion\":\"39.0.0\",\"id\":\"@esamelson/native-component-list\",\"releaseId\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"commitTime\":\"2020-11-11T00:17:54.797Z\",\"bundleUrl\":\"https://d1wp6m56sqw74a.cloudfront.net/%40esamelson%2Fnative-component-list%2F39.0.0%2F01c86fd863cfee878068eebd40f165df-39.0.0-ios.js\"}"
  private val newManifestJson =
    "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://d1wp6m56sqw74a.cloudfront.net/%40esamelson%2Fnative-component-list%2F39.0.0%2F01c86fd863cfee878068eebd40f165df-39.0.0-ios.js\",\"contentType\":\"application/javascript\"}}"
  private val bareManifestJson =
    "{\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"commitTime\":1609975977832}"

  private fun createConfig(): UpdatesConfiguration {
    val configMap = HashMap<String, Any>()
    configMap["updateUrl"] = Uri.parse("https://exp.host/@esamelson/native-component-list")
    return UpdatesConfiguration().loadValuesFromMap(configMap)
  }

  @Test
  @Throws(Exception::class)
  fun testGetManifest_Legacy() {
    val response = mockk<ManifestResponse>(relaxed = true)
    every { response.header("expo-protocol-version") } returns null
    val actual = getManifest(
      JSONObject(legacyManifestJson),
      response,
      createConfig()
    )
    Assert.assertTrue(actual is LegacyUpdateManifest)
  }

  @Test
  @Throws(Exception::class)
  fun testGetManifest_New() {
    val response = mockk<ManifestResponse>(relaxed = true)
    every { response.header("expo-protocol-version") } returns "0"
    val actual = getManifest(
      JSONObject(newManifestJson),
      response,
      createConfig()
    )
    Assert.assertTrue(actual is NewUpdateManifest)
  }

  @Test(expected = Exception::class)
  @Throws(Exception::class)
  fun testGetManifest_UnsupportedProtocolVersion() {
    val response = mockk<ManifestResponse>(relaxed = true)
    every { response.header("expo-protocol-version") } returns "1"
    getManifest(
      JSONObject(newManifestJson),
      response,
      createConfig()
    )
  }

  @Test
  @Throws(JSONException::class)
  fun testGetEmbeddedManifest_Legacy() {
    val actual = getEmbeddedManifest(
      JSONObject(legacyManifestJson),
      createConfig()
    )
    Assert.assertTrue(actual is LegacyUpdateManifest)
  }

  @Test
  @Throws(JSONException::class)
  fun testGetEmbeddedManifest_Legacy_Bare() {
    val actual = getEmbeddedManifest(
      JSONObject(bareManifestJson),
      createConfig()
    )
    Assert.assertTrue(actual is BareUpdateManifest)
  }
}
