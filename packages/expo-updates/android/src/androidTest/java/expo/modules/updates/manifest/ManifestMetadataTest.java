package expo.modules.updates.manifest;

import android.content.Context;
import android.net.Uri;

import org.json.JSONException;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.HashMap;

import androidx.room.Room;
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner;
import androidx.test.platform.app.InstrumentationRegistry;
import expo.modules.updates.UpdatesConfiguration;
import expo.modules.updates.db.UpdatesDatabase;

import static org.mockito.Mockito.*;

@RunWith(AndroidJUnit4ClassRunner.class)
public class ManifestMetadataTest {

  private UpdatesDatabase db;
  private UpdatesConfiguration config;
  private JSONObject manifestJson;

  @Before
  public void setupManifest() throws JSONException {
    String manifestString = "{\"runtimeVersion\":\"1\",\"id\":\"0eef8214-4833-4089-9dff-b4138a14f196\",\"createdAt\":\"2020-11-11T00:17:54.797Z\",\"launchAsset\":{\"url\":\"https://url.to/bundle.js\",\"contentType\":\"application/javascript\"}}";
    manifestJson = new JSONObject(manifestString);
    config = createConfig();
  }

  @Before
  public void createDb() {
    Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
    db = Room.inMemoryDatabaseBuilder(context, UpdatesDatabase.class).build();
  }

  @After
  public void closeDb() {
    db.close();
  }

  @Test
  public void testManifestFilters_OverwriteAllFields() throws JSONException {
    ManifestResponse response1 = mock(ManifestResponse.class);
    when(response1.header("expo-manifest-filters")).thenReturn("branch-name=\"rollout-1\",test=\"value\"");
    Manifest manifest1 = NewManifest.fromManifestJson(manifestJson, response1, config);
    ManifestMetadata.saveMetadata(manifest1, db, config);

    ManifestResponse response2 = mock(ManifestResponse.class);
    when(response2.header("expo-manifest-filters")).thenReturn("branch-name=\"rollout-2\"");
    Manifest manifest2 = NewManifest.fromManifestJson(manifestJson, response2, config);
    ManifestMetadata.saveMetadata(manifest2, db, config);

    JSONObject actual = ManifestMetadata.getManifestFilters(db, config);
    Assert.assertNotNull(actual);
    Assert.assertEquals(1, actual.length());
    Assert.assertEquals("rollout-2", actual.getString("branch-name"));
  }

  @Test
  public void testManifestFilters_OverwriteEmpty() throws JSONException {
    ManifestResponse response1 = mock(ManifestResponse.class);
    when(response1.header("expo-manifest-filters")).thenReturn("branch-name=\"rollout-1\"");
    Manifest manifest1 = NewManifest.fromManifestJson(manifestJson, response1, config);
    ManifestMetadata.saveMetadata(manifest1, db, config);

    ManifestResponse response2 = mock(ManifestResponse.class);
    when(response2.header("expo-manifest-filters")).thenReturn("");
    Manifest manifest2 = NewManifest.fromManifestJson(manifestJson, response2, config);
    ManifestMetadata.saveMetadata(manifest2, db, config);

    JSONObject actual = ManifestMetadata.getManifestFilters(db, config);
    Assert.assertNotNull(actual);
    Assert.assertEquals(0, actual.length());
  }

  @Test
  public void testManifestFilters_OverwriteNull() throws JSONException {
    ManifestResponse response1 = mock(ManifestResponse.class);
    when(response1.header("expo-manifest-filters")).thenReturn("branch-name=\"rollout-1\"");
    Manifest manifest1 = NewManifest.fromManifestJson(manifestJson, response1, config);
    ManifestMetadata.saveMetadata(manifest1, db, config);

    ManifestResponse response2 = mock(ManifestResponse.class);
    when(response2.header("expo-manifest-filters")).thenReturn(null);
    Manifest manifest2 = NewManifest.fromManifestJson(manifestJson, response2, config);
    ManifestMetadata.saveMetadata(manifest2, db, config);

    JSONObject actual = ManifestMetadata.getManifestFilters(db, config);
    Assert.assertNotNull(actual);
    Assert.assertEquals(1, actual.length());
    Assert.assertEquals("rollout-1", actual.getString("branch-name"));
  }

  private UpdatesConfiguration createConfig() {
    HashMap<String, Object> configMap = new HashMap<>();
    configMap.put("updateUrl", Uri.parse("https://exp.host/@test/test"));
    return new UpdatesConfiguration().loadValuesFromMap(configMap);
  }
}
