package expo.modules.updates.loader

import android.content.Context
import android.net.Uri
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import androidx.test.platform.app.InstrumentationRegistry
import expo.modules.updates.UpdatesConfiguration
import org.json.JSONException
import org.json.JSONObject
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4ClassRunner::class)
class FileDownloaderTest {
  private lateinit var context: Context

  @Before
  fun setup() {
    context = InstrumentationRegistry.getInstrumentation().targetContext
  }

  @Test
  fun testCacheControl_LegacyManifest() {
    val configMap = mapOf<String, Any>(
      "updateUrl" to Uri.parse("https://exp.host/@test/test"),
      "runtimeVersion" to "1.0",
      "usesLegacyManifest" to true
    )
    val config = UpdatesConfiguration().loadValuesFromMap(configMap)
    val actual = FileDownloader.setHeadersForManifestUrl(config, null, context)
    Assert.assertNull(actual.header("Cache-Control"))
  }

  @Test
  fun testCacheControl_NewManifest() {
    val configMap = mapOf<String, Any>(
      "updateUrl" to Uri.parse("https://u.expo.dev/00000000-0000-0000-0000-000000000000"),
      "runtimeVersion" to "1.0",
      "usesLegacyManifest" to false
    )
    val config = UpdatesConfiguration().loadValuesFromMap(configMap)
    val actual = FileDownloader.setHeadersForManifestUrl(config, null, context)
    Assert.assertNull(actual.header("Cache-Control"))
  }

  @Test
  @Throws(JSONException::class)
  fun testExtraHeaders_ObjectTypes() {
    val configMap = mapOf<String, Any>(
      "updateUrl" to Uri.parse("https://u.expo.dev/00000000-0000-0000-0000-000000000000"),
      "runtimeVersion" to "1.0",

    )
    val config = UpdatesConfiguration().loadValuesFromMap(configMap)
    val extraHeaders = JSONObject().apply {
      put("expo-string", "test")
      put("expo-number", 47.5)
      put("expo-boolean", true)
    }

    val actual = FileDownloader.setHeadersForManifestUrl(config, extraHeaders, context)
    Assert.assertEquals("test", actual.header("expo-string"))
    Assert.assertEquals("47.5", actual.header("expo-number"))
    Assert.assertEquals("true", actual.header("expo-boolean"))
  }

  @Test
  @Throws(JSONException::class)
  fun testExtraHeaders_OverrideOrder() {
    // custom headers configured at build-time should be able to override preset headers
    val headersMap = mapOf("expo-updates-environment" to "custom")
    val configMap = mapOf<String, Any>(
      "updateUrl" to Uri.parse("https://u.expo.dev/00000000-0000-0000-0000-000000000000"),
      "runtimeVersion" to "1.0",
      "requestHeaders" to headersMap
    )

    val config = UpdatesConfiguration().loadValuesFromMap(configMap)

    // serverDefinedHeaders should not be able to override preset headers
    val extraHeaders = JSONObject()
    extraHeaders.put("expo-platform", "ios")
    val actual = FileDownloader.setHeadersForManifestUrl(config, extraHeaders, context)
    Assert.assertEquals("android", actual.header("expo-platform"))
    Assert.assertEquals("custom", actual.header("expo-updates-environment"))
  }
}
