package expo.modules.updates.manifest

import android.net.Uri
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import expo.modules.updates.UpdatesConfiguration
import expo.modules.manifests.core.NewManifest
import org.json.JSONException
import org.json.JSONObject
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import java.util.*

@RunWith(AndroidJUnit4ClassRunner::class)
class NewUpdateManifestTest {
  @Test
  @Throws(JSONException::class)
  fun testFromManifestJson_AllFields() {
    // production manifests should require the id, createdAt, runtimeVersion, and launchAsset fields
    val manifestJson =
      "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}"
    val manifest = NewManifest(JSONObject(manifestJson))
    Assert.assertNotNull(NewUpdateManifest.fromNewManifest(manifest, null, createConfig()))
  }

  @Test(expected = JSONException::class)
  @Throws(JSONException::class)
  fun testFromManifestJson_NoId() {
    val manifestJson =
      "{\"runtimeVersion\":\"1\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}"
    val manifest = NewManifest(JSONObject(manifestJson))
    NewUpdateManifest.fromNewManifest(manifest, null, createConfig())
  }

  @Test(expected = JSONException::class)
  @Throws(JSONException::class)
  fun testFromManifestJson_NoCreatedAt() {
    val manifestJson =
      "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}"
    val manifest = NewManifest(JSONObject(manifestJson))
    NewUpdateManifest.fromNewManifest(manifest, null, createConfig())
  }

  @Test(expected = JSONException::class)
  @Throws(JSONException::class)
  fun testFromManifestJson_NoRuntimeVersion() {
    val manifestJson =
      "{\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}"
    val manifest = NewManifest(JSONObject(manifestJson))
    NewUpdateManifest.fromNewManifest(manifest, null, createConfig())
  }

  @Test(expected = JSONException::class)
  @Throws(JSONException::class)
  fun testFromManifestJson_NoLaunchAsset() {
    val manifestJson =
      "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",}"
    val manifest = NewManifest(JSONObject(manifestJson))
    NewUpdateManifest.fromNewManifest(manifest, null, createConfig())
  }

  private fun createConfig(): UpdatesConfiguration {
    val configMap = HashMap<String, Any>()
    configMap["updateUrl"] = Uri.parse("https://exp.host/@test/test")
    return UpdatesConfiguration().loadValuesFromMap(configMap)
  }

  @Test
  @Throws(JSONException::class)
  fun testHeaderDictionaryToJSONObject_SupportedTypes() {
    val actual =
      NewUpdateManifest.headerDictionaryToJSONObject("string=\"string-0000\", true=?1, false=?0, integer=47, decimal=47.5")
    Assert.assertNotNull(actual)
    Assert.assertEquals(5, actual!!.length().toLong())
    Assert.assertEquals("string-0000", actual.getString("string"))
    Assert.assertTrue(actual.getBoolean("true"))
    Assert.assertFalse(actual.getBoolean("false"))
    Assert.assertEquals(47, actual.getInt("integer").toLong())
    Assert.assertEquals(47.5, actual.getDouble("decimal"), 0.0)
  }

  @Test
  @Throws(JSONException::class)
  fun testHeaderDictionaryToJSONObject_IgnoresOtherTypes() {
    val actual =
      NewUpdateManifest.headerDictionaryToJSONObject("branch-name=\"rollout-1\", data=:w4ZibGV0w6ZydGUK:, list=(1 2)")
    Assert.assertNotNull(actual)
    Assert.assertEquals(1, actual!!.length().toLong())
    Assert.assertEquals("rollout-1", actual.getString("branch-name"))
  }

  @Test
  @Throws(JSONException::class)
  fun testHeaderDictionaryToJSONObject_IgnoresParameters() {
    val actual = NewUpdateManifest.headerDictionaryToJSONObject("abc=123;a=1;b=2")
    Assert.assertNotNull(actual)
    Assert.assertEquals(1, actual!!.length().toLong())
    Assert.assertEquals(123, actual.getInt("abc").toLong())
  }

  @Test
  fun testHeaderDictionaryToJSONObject_Empty() {
    val actual = NewUpdateManifest.headerDictionaryToJSONObject("")
    Assert.assertNotNull(actual)
    Assert.assertEquals(0, actual!!.length().toLong())
  }

  @Test
  fun testHeaderDictionaryToJSONObject_ParsingError() {
    val actual = NewUpdateManifest.headerDictionaryToJSONObject("bad dictionary")
    Assert.assertNull(actual)
  }
}
