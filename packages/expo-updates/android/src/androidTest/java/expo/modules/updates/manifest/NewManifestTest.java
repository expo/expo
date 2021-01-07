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
    String manifestJson = "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"js\"}}";
    JSONObject manifest = new JSONObject(manifestJson);
    Assert.assertNotNull(NewManifest.fromManifestJson(manifest, createConfig()));
  }

  @Test(expected = Exception.class)
  public void testFromManifestJson_NoId() throws JSONException {
    String manifestJson = "{\"runtimeVersion\":\"1\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"js\"}}";
    JSONObject manifest = new JSONObject(manifestJson);
    NewManifest.fromManifestJson(manifest, createConfig());
  }

  @Test(expected = Exception.class)
  public void testFromManifestJson_NoCreatedAt() throws JSONException {
    String manifestJson = "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"js\"}}";
    JSONObject manifest = new JSONObject(manifestJson);
    NewManifest.fromManifestJson(manifest, createConfig());
  }

  @Test(expected = Exception.class)
  public void testFromManifestJson_NoRuntimeVersion() throws JSONException {
    String manifestJson = "{\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"js\"}}";
    JSONObject manifest = new JSONObject(manifestJson);
    NewManifest.fromManifestJson(manifest, createConfig());
  }

  @Test(expected = Exception.class)
  public void testFromManifestJson_NoLaunchAsset() throws JSONException {
    String manifestJson = "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",}";
    JSONObject manifest = new JSONObject(manifestJson);
    NewManifest.fromManifestJson(manifest, createConfig());
  }

  @Test
  public void testFromManifestJson_StripsOptionalRootLevelKeys() throws JSONException {
    String manifestJsonWithRootLevelKeys = "{\"data\":{\"publicManifest\":{\"manifest\":{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"js\"}}}}}";
    Manifest manifest1 = NewManifest.fromManifestJson(new JSONObject(manifestJsonWithRootLevelKeys), createConfig());

    String manifestJsonNoRootLevelKeys = "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"js\"}}";
    Manifest manifest2 = NewManifest.fromManifestJson(new JSONObject(manifestJsonNoRootLevelKeys), createConfig());

    Assert.assertEquals(manifest1.getRawManifestJson().getString("id"), manifest2.getRawManifestJson().getString("id"));
  }

  private UpdatesConfiguration createConfig() {
    HashMap<String, Object> configMap = new HashMap<>();
    configMap.put("updateUrl", Uri.parse("https://exp.host/@test/test"));
    return new UpdatesConfiguration().loadValuesFromMap(configMap);
  }
}
