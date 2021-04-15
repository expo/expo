package expo.modules.updates.manifest

import android.net.Uri
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import expo.modules.updates.UpdatesConfiguration
import org.json.JSONException
import org.json.JSONObject
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import java.util.*

@RunWith(AndroidJUnit4ClassRunner::class)
class LegacyManifestTest {
    @Test
    fun testGetAssetsUrlBase_ExpoDomain() {
        val expected = Uri.parse("https://d1wp6m56sqw74a.cloudfront.net/~assets/")
        Assert.assertEquals(expected, LegacyManifest.getAssetsUrlBase(Uri.parse("https://exp.host/@test/test"), JSONObject()))
        Assert.assertEquals(expected, LegacyManifest.getAssetsUrlBase(Uri.parse("https://expo.io/@test/test"), JSONObject()))
        Assert.assertEquals(expected, LegacyManifest.getAssetsUrlBase(Uri.parse("https://expo.test/@test/test"), JSONObject()))
    }

    @Test
    fun testGetAssetsUrlBase_ExpoSubdomain() {
        val expected = Uri.parse("https://d1wp6m56sqw74a.cloudfront.net/~assets/")
        Assert.assertEquals(expected, LegacyManifest.getAssetsUrlBase(Uri.parse("https://staging.exp.host/@test/test"), JSONObject()))
        Assert.assertEquals(expected, LegacyManifest.getAssetsUrlBase(Uri.parse("https://staging.expo.io/@test/test"), JSONObject()))
        Assert.assertEquals(expected, LegacyManifest.getAssetsUrlBase(Uri.parse("https://staging.expo.test/@test/test"), JSONObject()))
    }

    @Test
    @Throws(JSONException::class)
    fun testGetAssetsUrlBase_AssetUrlOverride_AbsoluteUrl() {
        val assetUrlBase = "https://xxx.dev/~assets"
        val manifestUrl = Uri.parse("https://esamelson.github.io/self-hosting-test/android-index.json")
        val manifestJson = JSONObject()
        manifestJson.put("assetUrlOverride", assetUrlBase)
        val expected = Uri.parse(assetUrlBase)
        val actual = LegacyManifest.getAssetsUrlBase(manifestUrl, manifestJson)
        Assert.assertEquals(expected, actual)
    }

    @Test
    @Throws(JSONException::class)
    fun testGetAssetsUrlBase_AssetUrlOverride_RelativeUrl() {
        val manifestUrl = Uri.parse("https://esamelson.github.io/self-hosting-test/android-index.json")
        val manifestJson = JSONObject()
        manifestJson.put("assetUrlOverride", "my_assets")
        val expected = Uri.parse("https://esamelson.github.io/self-hosting-test/my_assets")
        val actual = LegacyManifest.getAssetsUrlBase(manifestUrl, manifestJson)
        Assert.assertEquals(expected, actual)
    }

    @Test
    @Throws(JSONException::class)
    fun testGetAssetsUrlBase_AssetUrlOverride_OriginRelativeUrl() {
        val manifestUrl = Uri.parse("https://esamelson.github.io/self-hosting-test/android-index.json")
        val manifestJson = JSONObject()
        manifestJson.put("assetUrlOverride", "/my_assets")
        val expected = Uri.parse("https://esamelson.github.io/my_assets")
        val actual = LegacyManifest.getAssetsUrlBase(manifestUrl, manifestJson)
        Assert.assertEquals(expected, actual)
    }

    @Test
    @Throws(JSONException::class)
    fun testGetAssetsUrlBase_AssetUrlOverride_RelativeUrlDotSlash() {
        val manifestUrl = Uri.parse("https://esamelson.github.io/self-hosting-test/android-index.json")
        val manifestJson = JSONObject()
        manifestJson.put("assetUrlOverride", "./my_assets")
        val expected = Uri.parse("https://esamelson.github.io/self-hosting-test/my_assets")
        val actual = LegacyManifest.getAssetsUrlBase(manifestUrl, manifestJson)
        Assert.assertEquals(expected, actual)
    }

    @Test
    @Throws(JSONException::class)
    fun testGetAssetsUrlBase_AssetUrlOverride_Normalize() {
        val manifestUrl = Uri.parse("https://esamelson.github.io/self-hosting-test/android-index.json")
        val manifestJson = JSONObject()
        manifestJson.put("assetUrlOverride", "./a/../b")
        val expected = Uri.parse("https://esamelson.github.io/self-hosting-test/b")
        val actual = LegacyManifest.getAssetsUrlBase(manifestUrl, manifestJson)
        Assert.assertEquals(expected, actual)
    }

    @Test
    @Throws(JSONException::class)
    fun testGetAssetsUrlBase_AssetUrlOverride_NormalizeToHostname() {
        val manifestUrl = Uri.parse("https://esamelson.github.io/self-hosting-test/android-index.json")
        val manifestJson = JSONObject()
        manifestJson.put("assetUrlOverride", "../b")
        val expected = Uri.parse("https://esamelson.github.io/b")
        val actual = LegacyManifest.getAssetsUrlBase(manifestUrl, manifestJson)
        Assert.assertEquals(expected, actual)
    }

    @Test
    @Throws(JSONException::class)
    fun testGetAssetsUrlBase_AssetUrlOverride_NormalizePastHostname() {
        val manifestUrl = Uri.parse("https://esamelson.github.io/self-hosting-test/android-index.json")
        val manifestJson = JSONObject()
        manifestJson.put("assetUrlOverride", "../../b")
        val expected = Uri.parse("https://esamelson.github.io/b")
        val actual = LegacyManifest.getAssetsUrlBase(manifestUrl, manifestJson)
        Assert.assertEquals(expected, actual)
    }

    @Test
    fun testGetAssetsUrlBase_AssetUrlOverride_Default() {
        val manifestUrl = Uri.parse("https://esamelson.github.io/self-hosting-test/android-index.json")
        val manifestJson = JSONObject()
        val expected = Uri.parse("https://esamelson.github.io/self-hosting-test/assets")
        val actual = LegacyManifest.getAssetsUrlBase(manifestUrl, manifestJson)
        Assert.assertEquals(expected, actual)
    }

    @Test
    @Throws(JSONException::class)
    fun testFromLegacyManifestJson_Development() {
        // manifests served from a developer tool should not need the releaseId and commitTime fields
        val legacyManifestJson = "{\"developer\":{\"tool\":\"expo-cli\"},\"sdkVersion\":\"39.0.0\",\"bundleUrl\":\"https://url.to/bundle.js\"}"
        val manifest = JSONObject(legacyManifestJson)
        Assert.assertNotNull(LegacyManifest.fromLegacyManifestJson(manifest, createConfig()))
    }

    @Test
    @Throws(JSONException::class)
    fun testFromLegacyManifestJson_Production_AllFields() {
        // production manifests should require the releaseId, commitTime, sdkVersion, and bundleUrl fields
        val legacyManifestJson = "{\"sdkVersion\":\"39.0.0\",\"releaseId\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"commitTime\":\"2020-11-11T00:17:54.797Z\",\"bundleUrl\":\"https://url.to/bundle.js\"}"
        val manifest = JSONObject(legacyManifestJson)
        Assert.assertNotNull(LegacyManifest.fromLegacyManifestJson(manifest, createConfig()))
    }

    @Test(expected = Exception::class)
    @Throws(JSONException::class)
    fun testFromLegacyManifestJson_Production_NoSdkVersion() {
        val legacyManifestJson = "{\"releaseId\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"commitTime\":\"2020-11-11T00:17:54.797Z\",\"bundleUrl\":\"https://url.to/bundle.js\"}"
        val manifest = JSONObject(legacyManifestJson)
        LegacyManifest.fromLegacyManifestJson(manifest, createConfig())
    }

    @Test(expected = Exception::class)
    @Throws(JSONException::class)
    fun testFromLegacyManifestJson_Production_NoReleaseId() {
        val legacyManifestJson = "{\"sdkVersion\":\"39.0.0\",\"commitTime\":\"2020-11-11T00:17:54.797Z\",\"bundleUrl\":\"https://url.to/bundle.js\"}"
        val manifest = JSONObject(legacyManifestJson)
        LegacyManifest.fromLegacyManifestJson(manifest, createConfig())
    }

    @Test(expected = Exception::class)
    @Throws(JSONException::class)
    fun testFromLegacyManifestJson_Production_NoCommitTime() {
        val legacyManifestJson = "{\"sdkVersion\":\"39.0.0\",\"releaseId\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"bundleUrl\":\"https://url.to/bundle.js\"}"
        val manifest = JSONObject(legacyManifestJson)
        LegacyManifest.fromLegacyManifestJson(manifest, createConfig())
    }

    @Test(expected = Exception::class)
    @Throws(JSONException::class)
    fun testFromLegacyManifestJson_Production_NoBundleUrl() {
        val legacyManifestJson = "{\"sdkVersion\":\"39.0.0\",\"releaseId\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"commitTime\":\"2020-11-11T00:17:54.797Z\"}"
        val manifest = JSONObject(legacyManifestJson)
        LegacyManifest.fromLegacyManifestJson(manifest, createConfig())
    }

    private fun createConfig(): UpdatesConfiguration {
        val configMap = HashMap<String, Any>()
        configMap["updateUrl"] = Uri.parse("https://exp.host/@test/test")
        return UpdatesConfiguration().loadValuesFromMap(configMap)
    }
}
