package expo.modules.updates.manifest

import android.net.Uri
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import expo.modules.updates.UpdatesConfiguration
import expo.modules.manifests.core.ExpoUpdatesManifest
import org.json.JSONException
import org.json.JSONObject
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import java.util.*

@RunWith(AndroidJUnit4ClassRunner::class)
class ExpoUpdatesUpdateTest {
  @Test
  @Throws(JSONException::class)
  fun testFromManifestJson_AllFields() {
    // production manifests should require the id, createdAt, runtimeVersion, and launchAsset fields
    val manifestJson =
      "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}"
    val manifest = ExpoUpdatesManifest(JSONObject(manifestJson))
    Assert.assertNotNull(ExpoUpdatesUpdate.fromExpoUpdatesManifest(manifest, null, createConfig()))
  }

  @Test(expected = JSONException::class)
  @Throws(JSONException::class)
  fun testFromManifestJson_NoId() {
    val manifestJson =
      "{\"runtimeVersion\":\"1\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}"
    val manifest = ExpoUpdatesManifest(JSONObject(manifestJson))
    ExpoUpdatesUpdate.fromExpoUpdatesManifest(manifest, null, createConfig())
  }

  @Test(expected = JSONException::class)
  @Throws(JSONException::class)
  fun testFromManifestJson_NoCreatedAt() {
    val manifestJson =
      "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}"
    val manifest = ExpoUpdatesManifest(JSONObject(manifestJson))
    ExpoUpdatesUpdate.fromExpoUpdatesManifest(manifest, null, createConfig())
  }

  @Test(expected = JSONException::class)
  @Throws(JSONException::class)
  fun testFromManifestJson_NoRuntimeVersion() {
    val manifestJson =
      "{\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}"
    val manifest = ExpoUpdatesManifest(JSONObject(manifestJson))
    ExpoUpdatesUpdate.fromExpoUpdatesManifest(manifest, null, createConfig())
  }

  @Test(expected = JSONException::class)
  @Throws(JSONException::class)
  fun testFromManifestJson_NoLaunchAsset() {
    val manifestJson =
      "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",}"
    val manifest = ExpoUpdatesManifest(JSONObject(manifestJson))
    ExpoUpdatesUpdate.fromExpoUpdatesManifest(manifest, null, createConfig())
  }

  private fun createConfig(): UpdatesConfiguration {
    val configMap = HashMap<String, Any>()
    configMap["updateUrl"] = Uri.parse("https://exp.host/@test/test")
    return UpdatesConfiguration(null, configMap)
  }
}
