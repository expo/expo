package expo.modules.updates.loader;

import android.content.Context;
import android.net.Uri;

import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.stubbing.Answer;

import java.io.File;
import java.io.IOException;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.List;

import androidx.room.Room;
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner;
import androidx.test.platform.app.InstrumentationRegistry;

import expo.modules.manifests.core.BareManifest;
import expo.modules.updates.UpdatesConfiguration;
import expo.modules.updates.db.UpdatesDatabase;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.db.enums.UpdateStatus;
import expo.modules.updates.manifest.BareUpdateManifest;
import expo.modules.updates.manifest.UpdateManifest;

import static org.mockito.Mockito.*;

@RunWith(AndroidJUnit4ClassRunner.class)
public class EmbeddedLoaderTest {

  private UpdatesDatabase db;
  private UpdatesConfiguration configuration;
  private UpdateManifest manifest;

  private EmbeddedLoader loader;
  private LoaderFiles mockLoaderFiles;

  @Before
  public void setup() throws JSONException {
    HashMap<String, Object> configMap = new HashMap<>();
    configMap.put("updateUrl", Uri.parse("https://exp.host/@test/test"));
    configMap.put("runtimeVersion", "1.0");
    configuration = new UpdatesConfiguration().loadValuesFromMap(configMap);

    Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
    db = Room.inMemoryDatabaseBuilder(context, UpdatesDatabase.class).build();
    mockLoaderFiles = mock(LoaderFiles.class);

    loader = new EmbeddedLoader(
            context,
            configuration,
            db,
            new File("testDirectory"),
            mockLoaderFiles
    );

    manifest = BareUpdateManifest.Companion.fromBareManifest(
            new BareManifest(new JSONObject("{\"id\":\"c3c47024-0e03-4cb4-8e8b-1a0ba2260be6\",\"commitTime\":1630374791665,\"assets\":[{\"name\":\"robot-dev\",\"type\":\"png\",\"scale\":1,\"packagerHash\":\"54da1e9816c77e30ebc5920e256736f2\",\"subdirectory\":\"/assets\",\"scales\":[1],\"resourcesFilename\":\"robotdev\",\"resourcesFolder\":\"drawable\"}]}")),
            configuration
    );
  }

  @Test
  public void testEmbeddedLoader_SimpleCase() throws IOException, NoSuchAlgorithmException {
    loader.processUpdateManifest(manifest);

    verify(mockLoaderFiles, times(2)).copyAssetAndGetHash(any(), any(), any());

    List<UpdateEntity> updates = db.updateDao().loadAllUpdates();
    Assert.assertEquals(1, updates.size());
    Assert.assertEquals(UpdateStatus.READY, updates.get(0).status);

    List<AssetEntity> assets = db.assetDao().loadAllAssets();
    Assert.assertEquals(2, assets.size());
  }

  @Test
  public void testEmbeddedLoader_FailureCase() throws IOException, NoSuchAlgorithmException {
    when(mockLoaderFiles.copyAssetAndGetHash(any(), any(), any())).thenThrow(new IOException("mock failed to copy asset"));

    loader.processUpdateManifest(manifest);

    verify(mockLoaderFiles, times(2)).copyAssetAndGetHash(any(), any(), any());

    List<UpdateEntity> updates = db.updateDao().loadAllUpdates();
    Assert.assertEquals(1, updates.size());
    // status embedded indicates the update wasn't able to be fully copied to the expo-updates cache
    Assert.assertEquals(UpdateStatus.EMBEDDED, updates.get(0).status);

    List<AssetEntity> assets = db.assetDao().loadAllAssets();
    Assert.assertEquals(0, assets.size());
  }

  @Test
  public void testEmbeddedLoader_MultipleScales() throws JSONException, IOException, NoSuchAlgorithmException {
    UpdateManifest multipleScalesManifest = BareUpdateManifest.Companion.fromBareManifest(
            new BareManifest(new JSONObject("{\"id\":\"d26d7f92-c7a6-4c44-9ada-4804eda7e6e2\",\"commitTime\":1630435460610,\"assets\":[{\"name\":\"robot-dev\",\"type\":\"png\",\"scale\":1,\"packagerHash\":\"54da1e9816c77e30ebc5920e256736f2\",\"subdirectory\":\"/assets\",\"scales\":[1,2],\"resourcesFilename\":\"robotdev\",\"resourcesFolder\":\"drawable\"},{\"name\":\"robot-dev\",\"type\":\"png\",\"scale\":2,\"packagerHash\":\"4ecff55cf37460b7f768dc7b72bcea6b\",\"subdirectory\":\"/assets\",\"scales\":[1,2],\"resourcesFilename\":\"robotdev\",\"resourcesFolder\":\"drawable\"}]}")),
            configuration
    );

    loader.processUpdateManifest(multipleScalesManifest);

    verify(mockLoaderFiles, times(2)).copyAssetAndGetHash(any(), any(), any());

    List<UpdateEntity> updates = db.updateDao().loadAllUpdates();
    Assert.assertEquals(1, updates.size());
    Assert.assertEquals(UpdateStatus.EMBEDDED, updates.get(0).status);

    List<AssetEntity> assets = db.assetDao().loadAllAssets();
    Assert.assertEquals(2, assets.size());
  }

  @Test
  public void testEmbeddedLoader_AssetExists_BothDbAndDisk() throws IOException, NoSuchAlgorithmException {
    // return true when asked if file 54da1e9816c77e30ebc5920e256736f2 exists
    when(mockLoaderFiles.fileExists(any())).thenAnswer((Answer<Boolean>) invocation -> invocation.getArgument(0).toString().contains("54da1e9816c77e30ebc5920e256736f2"));

    AssetEntity existingAsset = new AssetEntity("54da1e9816c77e30ebc5920e256736f2", "png");
    existingAsset.relativePath = "54da1e9816c77e30ebc5920e256736f2.png";
    db.assetDao()._insertAsset(existingAsset);

    loader.processUpdateManifest(manifest);

    // only 1 asset (bundle) should be copied since the other asset already exists
    verify(mockLoaderFiles, times(1)).copyAssetAndGetHash(any(), any(), any());

    List<UpdateEntity> updates = db.updateDao().loadAllUpdates();
    Assert.assertEquals(1, updates.size());
    Assert.assertEquals(UpdateStatus.READY, updates.get(0).status);

    List<AssetEntity> assets = db.assetDao().loadAllAssets();
    Assert.assertEquals(2, assets.size());
  }

  @Test
  public void testEmbeddedLoader_AssetExists_DbOnly() throws IOException, NoSuchAlgorithmException {
    // return true when asked if file 54da1e9816c77e30ebc5920e256736f2 exists
    when(mockLoaderFiles.fileExists(any())).thenReturn(false);

    AssetEntity existingAsset = new AssetEntity("54da1e9816c77e30ebc5920e256736f2", "png");
    existingAsset.relativePath = "54da1e9816c77e30ebc5920e256736f2.png";
    db.assetDao()._insertAsset(existingAsset);

    loader.processUpdateManifest(manifest);

    // both assets should be copied regardless of what the database says
    verify(mockLoaderFiles, times(2)).copyAssetAndGetHash(any(), any(), any());

    List<UpdateEntity> updates = db.updateDao().loadAllUpdates();
    Assert.assertEquals(1, updates.size());
    Assert.assertEquals(UpdateStatus.READY, updates.get(0).status);

    List<AssetEntity> assets = db.assetDao().loadAllAssets();
    Assert.assertEquals(2, assets.size());
  }

  @Test
  public void testEmbeddedLoader_AssetExists_DiskOnly() throws IOException, NoSuchAlgorithmException {
    // return true when asked if file 54da1e9816c77e30ebc5920e256736f2 exists
    when(mockLoaderFiles.fileExists(any())).thenAnswer((Answer<Boolean>) invocation -> invocation.getArgument(0).toString().contains("54da1e9816c77e30ebc5920e256736f2"));

    Assert.assertEquals(0, db.assetDao().loadAllAssets().size());

    loader.processUpdateManifest(manifest);

    // only 1 asset (bundle) should be copied since the other asset already exists
    verify(mockLoaderFiles, times(1)).copyAssetAndGetHash(any(), any(), any());

    List<UpdateEntity> updates = db.updateDao().loadAllUpdates();
    Assert.assertEquals(1, updates.size());
    Assert.assertEquals(UpdateStatus.READY, updates.get(0).status);

    // both assets should have been added to the db even though one already existed on disk
    List<AssetEntity> assets = db.assetDao().loadAllAssets();
    Assert.assertEquals(2, assets.size());
  }

  @Test
  public void testEmbeddedLoader_UpdateExists_Ready() throws IOException, NoSuchAlgorithmException {
    UpdateEntity update = new UpdateEntity(
            manifest.getUpdateEntity().id,
            manifest.getUpdateEntity().commitTime,
            manifest.getUpdateEntity().runtimeVersion,
            manifest.getUpdateEntity().scopeKey);
    update.status = UpdateStatus.READY;
    db.updateDao().insertUpdate(update);

    loader.processUpdateManifest(manifest);

    verify(mockLoaderFiles, times(0)).copyAssetAndGetHash(any(), any(), any());

    List<UpdateEntity> updates = db.updateDao().loadAllUpdates();
    Assert.assertEquals(1, updates.size());
    Assert.assertEquals(UpdateStatus.READY, updates.get(0).status);
  }

  @Test
  public void testEmbeddedLoader_UpdateExists_Pending() throws IOException, NoSuchAlgorithmException {
    UpdateEntity update = new UpdateEntity(
            manifest.getUpdateEntity().id,
            manifest.getUpdateEntity().commitTime,
            manifest.getUpdateEntity().runtimeVersion,
            manifest.getUpdateEntity().scopeKey);
    update.status = UpdateStatus.PENDING;
    db.updateDao().insertUpdate(update);

    loader.processUpdateManifest(manifest);

    // missing assets should still be copied
    verify(mockLoaderFiles, times(2)).copyAssetAndGetHash(any(), any(), any());

    List<UpdateEntity> updates = db.updateDao().loadAllUpdates();
    Assert.assertEquals(1, updates.size());
    Assert.assertEquals(UpdateStatus.READY, updates.get(0).status);

    List<AssetEntity> assets = db.assetDao().loadAllAssets();
    Assert.assertEquals(2, assets.size());
  }
}
