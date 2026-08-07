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

  @Test
  @Throws(JSONException::class)
  fun testFromManifestJson_RelativeAssetUrls() {
    val manifestJson =
      "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"key\":\"bundle\",\"url\":\"index.bundle?platform=android\",\"contentType\":\"application/javascript\"},\"assets\":[{\"key\":\"asset\",\"url\":\"assets/icon.png\",\"fileExtension\":\".png\"}]}"
    val manifest = ExpoUpdatesManifest(JSONObject(manifestJson))
    val update = ExpoUpdatesUpdate.fromExpoUpdatesManifest(manifest, null, createConfig())

    Assert.assertEquals(
      "https://exp.host/@test/index.bundle?platform=android",
      update.assetEntityList[0].url.toString()
    )
    Assert.assertEquals(
      "https://exp.host/@test/assets/icon.png",
      update.assetEntityList[1].url.toString()
    )
    Assert.assertEquals(
      "https://exp.host/@test/index.bundle?platform=android",
      update.manifest.getBundleURL()
    )
  }

  @Test
  @Throws(JSONException::class)
  fun testFromManifestJson_RelativeAssetUrls_BaseUrlWithoutPath() {
    // Regression test: development servers are addressed without a path
    // (e.g. "http://192.168.1.5:8081"). Android's java.net.URI.resolve drops the "/"
    // between authority and relative path in that case, producing invalid URLs like
    // "http://192.168.1.5:8081apps/project/index.bundle".
    val manifestJson =
      "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"key\":\"bundle\",\"url\":\"apps/testproject/index.bundle?platform=android\",\"contentType\":\"application/javascript\"}}"
    val manifest = ExpoUpdatesManifest(JSONObject(manifestJson))
    val update = ExpoUpdatesUpdate.fromExpoUpdatesManifest(
      manifest,
      null,
      createConfig(updateUrl = "http://192.168.1.5:8081")
    )

    Assert.assertEquals(
      "http://192.168.1.5:8081/apps/testproject/index.bundle?platform=android",
      update.manifest.getBundleURL()
    )
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

  private fun createConfig(updateUrl: String = "https://exp.host/@test/test"): UpdatesConfiguration {
    val configMap = HashMap<String, Any>()
    configMap["updateUrl"] = Uri.parse(updateUrl)
    return UpdatesConfiguration(null, configMap)
  }
}
