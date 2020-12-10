package expo.modules.updates.manifest;

import android.net.Uri;

import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner;

@RunWith(AndroidJUnit4ClassRunner.class)
public class LegacyManifestTest {
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
  public void testGetAssetsUrlBase_assetUrlOverride_relativeUrlDotSlash() throws JSONException {
    Uri manifestUrl = Uri.parse("https://esamelson.github.io/self-hosting-test/android-index.json");
    JSONObject manifestJson = new JSONObject();
    manifestJson.put("assetUrlOverride", "./assets");

    Uri expected = Uri.parse("https://esamelson.github.io/self-hosting-test/assets");
    Uri actual = LegacyManifest.getAssetsUrlBase(manifestUrl, manifestJson);
    Assert.assertEquals(expected, actual);
  }

  @Test
  public void testGetAssetsUrlBase_assetUrlOverride_default() throws JSONException {
    Uri manifestUrl = Uri.parse("https://esamelson.github.io/self-hosting-test/android-index.json");
    JSONObject manifestJson = new JSONObject();

    Uri expected = Uri.parse("https://esamelson.github.io/self-hosting-test/assets");
    Uri actual = LegacyManifest.getAssetsUrlBase(manifestUrl, manifestJson);
    Assert.assertEquals(expected, actual);
  }
}
