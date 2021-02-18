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
public class NewManifestTest {
  @Test
  public void testFromManifestJson_AllFields() throws JSONException {
    // production manifests should require the id, createdAt, runtimeVersion, and launchAsset fields
    String manifestJson = "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}";
    JSONObject manifest = new JSONObject(manifestJson);
    Assert.assertNotNull(NewManifest.fromManifestJson(manifest, null, createConfig()));
  }

  @Test(expected = JSONException.class)
  public void testFromManifestJson_NoId() throws JSONException {
    String manifestJson = "{\"runtimeVersion\":\"1\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}";
    JSONObject manifest = new JSONObject(manifestJson);
    NewManifest.fromManifestJson(manifest, null, createConfig());
  }

  @Test(expected = JSONException.class)
  public void testFromManifestJson_NoCreatedAt() throws JSONException {
    String manifestJson = "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}";
    JSONObject manifest = new JSONObject(manifestJson);
    NewManifest.fromManifestJson(manifest, null, createConfig());
  }

  @Test(expected = JSONException.class)
  public void testFromManifestJson_NoRuntimeVersion() throws JSONException {
    String manifestJson = "{\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}";
    JSONObject manifest = new JSONObject(manifestJson);
    NewManifest.fromManifestJson(manifest, null, createConfig());
  }

  @Test(expected = JSONException.class)
  public void testFromManifestJson_NoLaunchAsset() throws JSONException {
    String manifestJson = "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",}";
    JSONObject manifest = new JSONObject(manifestJson);
    NewManifest.fromManifestJson(manifest, null, createConfig());
  }

  @Test
  public void testFromManifestJson_StripsOptionalRootLevelKeys() throws JSONException {
    String manifestJsonWithRootLevelKeys = "{\"manifest\":{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}}";
    Manifest manifest1 = NewManifest.fromManifestJson(new JSONObject(manifestJsonWithRootLevelKeys), null, createConfig());

    String manifestJsonNoRootLevelKeys = "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}";
    Manifest manifest2 = NewManifest.fromManifestJson(new JSONObject(manifestJsonNoRootLevelKeys), null, createConfig());

    Assert.assertEquals(manifest1.getRawManifestJson().getString("id"), manifest2.getRawManifestJson().getString("id"));
  }

  private UpdatesConfiguration createConfig() {
    HashMap<String, Object> configMap = new HashMap<>();
    configMap.put("updateUrl", Uri.parse("https://exp.host/@test/test"));
    return new UpdatesConfiguration().loadValuesFromMap(configMap);
  }

  @Test
  public void testHeaderDictionaryToJSONObject_SupportedTypes() throws JSONException {
    JSONObject actual = NewManifest.headerDictionaryToJSONObject("string=\"string-0000\", true=?1, false=?0, integer=47, decimal=47.5");
    Assert.assertNotNull(actual);
    Assert.assertEquals(5, actual.length());
    Assert.assertEquals("string-0000", actual.getString("string"));
    Assert.assertTrue(actual.getBoolean("true"));
    Assert.assertFalse(actual.getBoolean("false"));
    Assert.assertEquals(47, actual.getInt("integer"));
    Assert.assertEquals(47.5, actual.getDouble("decimal"), 0);
  }

  @Test
  public void testHeaderDictionaryToJSONObject_IgnoresOtherTypes() throws JSONException {
    JSONObject actual = NewManifest.headerDictionaryToJSONObject("branch-name=\"rollout-1\", data=:w4ZibGV0w6ZydGUK:, list=(1 2)");
    Assert.assertNotNull(actual);
    Assert.assertEquals(1, actual.length());
    Assert.assertEquals("rollout-1", actual.getString("branch-name"));
  }

  @Test
  public void testHeaderDictionaryToJSONObject_IgnoresParameters() throws JSONException {
    JSONObject actual = NewManifest.headerDictionaryToJSONObject("abc=123;a=1;b=2");
    Assert.assertNotNull(actual);
    Assert.assertEquals(1, actual.length());
    Assert.assertEquals(123, actual.getInt("abc"));
  }

  @Test
  public void testHeaderDictionaryToJSONObject_Empty() {
    JSONObject actual = NewManifest.headerDictionaryToJSONObject("");
    Assert.assertNotNull(actual);
    Assert.assertEquals(0, actual.length());
  }

  @Test
  public void testHeaderDictionaryToJSONObject_ParsingError() {
    JSONObject actual = NewManifest.headerDictionaryToJSONObject("bad dictionary");
    Assert.assertNull(actual);
  }
}
