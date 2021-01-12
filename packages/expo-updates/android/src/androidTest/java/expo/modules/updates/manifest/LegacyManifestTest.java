package expo.modules.updates.manifest;

import android.net.Uri;

import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.HashMap;

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner;
import expo.modules.updates.UpdatesConfiguration;

@RunWith(AndroidJUnit4ClassRunner.class)
public class LegacyManifestTest {
  @Test
  public void testGetAssetsUrlBase_ExpoDomain() {
    Uri expected = Uri.parse("https://d1wp6m56sqw74a.cloudfront.net/~assets/");
    Assert.assertEquals(expected, LegacyManifest.getAssetsUrlBase(Uri.parse("https://exp.host/@test/test"), new JSONObject()));
    Assert.assertEquals(expected, LegacyManifest.getAssetsUrlBase(Uri.parse("https://expo.io/@test/test"), new JSONObject()));
    Assert.assertEquals(expected, LegacyManifest.getAssetsUrlBase(Uri.parse("https://expo.test/@test/test"), new JSONObject()));
  }

  @Test
  public void testGetAssetsUrlBase_ExpoSubdomain() {
    Uri expected = Uri.parse("https://d1wp6m56sqw74a.cloudfront.net/~assets/");
    Assert.assertEquals(expected, LegacyManifest.getAssetsUrlBase(Uri.parse("https://staging.exp.host/@test/test"), new JSONObject()));
    Assert.assertEquals(expected, LegacyManifest.getAssetsUrlBase(Uri.parse("https://staging.expo.io/@test/test"), new JSONObject()));
    Assert.assertEquals(expected, LegacyManifest.getAssetsUrlBase(Uri.parse("https://staging.expo.test/@test/test"), new JSONObject()));
  }

  @Test
  public void testGetAssetsUrlBase_assetUrlOverride_absoluteUrl() throws JSONException {
    String assetUrlBase = "https://xxx.dev/~assets";

    Uri manifestUrl = Uri.parse("https://esamelson.github.io/self-hosting-test/android-index.json");
    JSONObject manifestJson = new JSONObject();
    manifestJson.put("assetUrlOverride", assetUrlBase);

    Uri expected = Uri.parse(assetUrlBase);
    Uri actual = LegacyManifest.getAssetsUrlBase(manifestUrl, manifestJson);
    Assert.assertEquals(expected, actual);
  }

  @Test
  public void testGetAssetsUrlBase_assetUrlOverride_relativeUrl() throws JSONException {
    Uri manifestUrl = Uri.parse("https://esamelson.github.io/self-hosting-test/android-index.json");
    JSONObject manifestJson = new JSONObject();
    manifestJson.put("assetUrlOverride", "my_assets");

    Uri expected = Uri.parse("https://esamelson.github.io/self-hosting-test/my_assets");
    Uri actual = LegacyManifest.getAssetsUrlBase(manifestUrl, manifestJson);
    Assert.assertEquals(expected, actual);
  }

  @Test
  public void testGetAssetsUrlBase_assetUrlOverride_originRelativeUrl() throws JSONException {
    Uri manifestUrl = Uri.parse("https://esamelson.github.io/self-hosting-test/android-index.json");
    JSONObject manifestJson = new JSONObject();
    manifestJson.put("assetUrlOverride", "/my_assets");

    Uri expected = Uri.parse("https://esamelson.github.io/my_assets");
    Uri actual = LegacyManifest.getAssetsUrlBase(manifestUrl, manifestJson);
    Assert.assertEquals(expected, actual);
  }

  @Test
  public void testGetAssetsUrlBase_assetUrlOverride_relativeUrlDotSlash() throws JSONException {
    Uri manifestUrl = Uri.parse("https://esamelson.github.io/self-hosting-test/android-index.json");
    JSONObject manifestJson = new JSONObject();
    manifestJson.put("assetUrlOverride", "./my_assets");

    Uri expected = Uri.parse("https://esamelson.github.io/self-hosting-test/my_assets");
    Uri actual = LegacyManifest.getAssetsUrlBase(manifestUrl, manifestJson);
    Assert.assertEquals(expected, actual);
  }

  @Test
  public void testGetAssetsUrlBase_assetUrlOverride_default() {
    Uri manifestUrl = Uri.parse("https://esamelson.github.io/self-hosting-test/android-index.json");
    JSONObject manifestJson = new JSONObject();

    Uri expected = Uri.parse("https://esamelson.github.io/self-hosting-test/assets");
    Uri actual = LegacyManifest.getAssetsUrlBase(manifestUrl, manifestJson);
    Assert.assertEquals(expected, actual);
  }

  @Test
  public void testFromLegacyManifestJson_Development() throws JSONException {
    // manifests served from a developer tool should not need the releaseId and commitTime fields
    String legacyManifestJson = "{\"developer\":{\"tool\":\"expo-cli\"},\"sdkVersion\":\"39.0.0\",\"bundleUrl\":\"https://url.to/bundle.js\"}";
    JSONObject manifest = new JSONObject(legacyManifestJson);
    Assert.assertNotNull(LegacyManifest.fromLegacyManifestJson(manifest, createConfig()));
  }

  @Test
  public void testFromLegacyManifestJson_Production_AllFields() throws JSONException {
    // production manifests should require the releaseId, commitTime, sdkVersion, and bundleUrl fields
    String legacyManifestJson = "{\"sdkVersion\":\"39.0.0\",\"releaseId\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"commitTime\":\"2020-11-11T00:17:54.797Z\",\"bundleUrl\":\"https://url.to/bundle.js\"}";
    JSONObject manifest = new JSONObject(legacyManifestJson);
    Assert.assertNotNull(LegacyManifest.fromLegacyManifestJson(manifest, createConfig()));
  }

  @Test(expected = Exception.class)
  public void testFromLegacyManifestJson_Production_NoSdkVersion() throws JSONException {
    String legacyManifestJson = "{\"releaseId\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"commitTime\":\"2020-11-11T00:17:54.797Z\",\"bundleUrl\":\"https://url.to/bundle.js\"}";
    JSONObject manifest = new JSONObject(legacyManifestJson);
    LegacyManifest.fromLegacyManifestJson(manifest, createConfig());
  }

  @Test(expected = Exception.class)
  public void testFromLegacyManifestJson_Production_NoReleaseId() throws JSONException {
    String legacyManifestJson = "{\"sdkVersion\":\"39.0.0\",\"commitTime\":\"2020-11-11T00:17:54.797Z\",\"bundleUrl\":\"https://url.to/bundle.js\"}";
    JSONObject manifest = new JSONObject(legacyManifestJson);
    LegacyManifest.fromLegacyManifestJson(manifest, createConfig());
  }

  @Test(expected = Exception.class)
  public void testFromLegacyManifestJson_Production_NoCommitTime() throws JSONException {
    String legacyManifestJson = "{\"sdkVersion\":\"39.0.0\",\"releaseId\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"bundleUrl\":\"https://url.to/bundle.js\"}";
    JSONObject manifest = new JSONObject(legacyManifestJson);
    LegacyManifest.fromLegacyManifestJson(manifest, createConfig());
  }

  @Test(expected = Exception.class)
  public void testFromLegacyManifestJson_Production_NoBundleUrl() throws JSONException {
    String legacyManifestJson = "{\"sdkVersion\":\"39.0.0\",\"releaseId\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"commitTime\":\"2020-11-11T00:17:54.797Z\"}";
    JSONObject manifest = new JSONObject(legacyManifestJson);
    LegacyManifest.fromLegacyManifestJson(manifest, createConfig());
  }

  private UpdatesConfiguration createConfig() {
    HashMap<String, Object> configMap = new HashMap<>();
    configMap.put("updateUrl", Uri.parse("https://exp.host/@test/test"));
    return new UpdatesConfiguration().loadValuesFromMap(configMap);
  }
}
