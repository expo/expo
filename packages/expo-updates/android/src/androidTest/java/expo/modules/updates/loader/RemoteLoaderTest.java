package expo.modules.updates.loader;

import android.content.Context;
import android.net.Uri;

import androidx.room.Room;
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner;
import androidx.test.platform.app.InstrumentationRegistry;

import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.stubbing.Answer;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;

import expo.modules.manifests.core.LegacyManifest;
import expo.modules.updates.UpdatesConfiguration;
import expo.modules.updates.db.UpdatesDatabase;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.db.enums.UpdateStatus;
import expo.modules.updates.manifest.LegacyUpdateManifest;
import expo.modules.updates.manifest.UpdateManifest;

import static org.mockito.Mockito.*;

@RunWith(AndroidJUnit4ClassRunner.class)
public class RemoteLoaderTest {

  private UpdatesDatabase db;
  private UpdatesConfiguration configuration;
  private UpdateManifest manifest;

  private RemoteLoader loader;
  private LoaderFiles mockLoaderFiles;
  private FileDownloader mockFileDownloader;
  private Loader.LoaderCallback mockCallback;

  @Before
  public void setup() throws JSONException {
    HashMap<String, Object> configMap = new HashMap<>();
    configMap.put("updateUrl", Uri.parse("https://exp.host/@test/test"));
    configMap.put("runtimeVersion", "1.0");
    configuration = new UpdatesConfiguration().loadValuesFromMap(configMap);

    Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
    db = Room.inMemoryDatabaseBuilder(context, UpdatesDatabase.class).build();
    mockLoaderFiles = mock(LoaderFiles.class);
    mockFileDownloader = mock(FileDownloader.class);

    loader = new RemoteLoader(
            context,
            configuration,
            db,
            mockFileDownloader,
            new File("testDirectory"),
            mockLoaderFiles
    );

    manifest = LegacyUpdateManifest.Companion.fromLegacyManifest(
            new LegacyManifest(new JSONObject("{\"name\":\"updates-unit-test-template\",\"slug\":\"updates-unit-test-template\",\"sdkVersion\":\"42.0.0\",\"bundledAssets\":[\"asset_54da1e9816c77e30ebc5920e256736f2.png\"],\"currentFullName\":\"@esamelson/updates-unit-test-template\",\"originalFullName\":\"@esamelson/updates-unit-test-template\",\"id\":\"@esamelson/updates-unit-test-template\",\"scopeKey\":\"@esamelson/updates-unit-test-template\",\"releaseId\":\"2c246487-8879-43ad-a67b-2c22d8a5675e\",\"publishedTime\":\"2021-09-01T00:05:57.701Z\",\"commitTime\":\"2021-09-01T00:05:57.737Z\",\"bundleUrl\":\"https://d1wp6m56sqw74a.cloudfront.net/%40esamelson%2Fupdates-unit-test-template%2F1.0.0%2Fe5507cbb1760d32bb20d77cefc8cfff5-42.0.0-ios.js\",\"bundleKey\":\"e5507cbb1760d32bb20d77cefc8cfff5\",\"releaseChannel\":\"default\",\"hostUri\":\"exp.host/@esamelson/updates-unit-test-template\"}")),
            configuration
    );
    doAnswer((Answer<Void>) invocation -> {
      FileDownloader.ManifestDownloadCallback callback = invocation.getArgument(3);
      callback.onSuccess(manifest);
      return null;
    }).when(mockFileDownloader).downloadManifest(any(), any(), any(), any());
    doAnswer((Answer<Void>) invocation -> {
      AssetEntity asset = invocation.getArgument(0);
      FileDownloader.AssetDownloadCallback callback = invocation.getArgument(3);
      callback.onSuccess(asset, true);
      return null;
    }).when(mockFileDownloader).downloadAsset(any(), any(), any(), any());

    mockCallback = mock(Loader.LoaderCallback.class);
    when(mockCallback.onUpdateManifestLoaded(any())).thenReturn(true);
  }

  @Test
  public void testRemoteLoader_SimpleCase() {
    loader.start(mockCallback);

    verify(mockCallback).onSuccess(any());
    verify(mockCallback, times(0)).onFailure(any());
    verify(mockFileDownloader, times(2)).downloadAsset(any(), any(), any(), any());

    List<UpdateEntity> updates = db.updateDao().loadAllUpdates();
    Assert.assertEquals(1, updates.size());
    Assert.assertEquals(UpdateStatus.READY, updates.get(0).status);

    List<AssetEntity> assets = db.assetDao().loadAllAssets();
    Assert.assertEquals(2, assets.size());
  }

  @Test
  public void testRemoteLoader_FailureCase() {
    doAnswer((Answer<Void>) invocation -> {
      AssetEntity asset = invocation.getArgument(0);
      FileDownloader.AssetDownloadCallback callback = invocation.getArgument(3);
      callback.onFailure(new IOException("mock failed to download asset"), asset);
      return null;
    }).when(mockFileDownloader).downloadAsset(any(), any(), any(), any());

    loader.start(mockCallback);

    verify(mockCallback, times(0)).onSuccess(any());
    verify(mockCallback).onFailure(any());
    verify(mockFileDownloader, times(2)).downloadAsset(any(), any(), any(), any());

    List<UpdateEntity> updates = db.updateDao().loadAllUpdates();
    Assert.assertEquals(1, updates.size());
    Assert.assertEquals(UpdateStatus.PENDING, updates.get(0).status);

    List<AssetEntity> assets = db.assetDao().loadAllAssets();
    Assert.assertEquals(0, assets.size());
  }

  @Test
  public void testRemoteLoader_AssetExists_BothDbAndDisk() {
    // return true when asked if file 54da1e9816c77e30ebc5920e256736f2 exists
    when(mockLoaderFiles.fileExists(any())).thenAnswer((Answer<Boolean>) invocation -> invocation.getArgument(0).toString().contains("54da1e9816c77e30ebc5920e256736f2"));

    AssetEntity existingAsset = new AssetEntity("54da1e9816c77e30ebc5920e256736f2", "png");
    existingAsset.relativePath = "54da1e9816c77e30ebc5920e256736f2.png";
    db.assetDao()._insertAsset(existingAsset);

    loader.start(mockCallback);

    verify(mockCallback).onSuccess(any());
    verify(mockCallback, times(0)).onFailure(any());

    // only 1 asset (bundle) should be downloaded since the other asset already exists
    verify(mockFileDownloader, times(1)).downloadAsset(any(), any(), any(), any());

    List<UpdateEntity> updates = db.updateDao().loadAllUpdates();
    Assert.assertEquals(1, updates.size());
    Assert.assertEquals(UpdateStatus.READY, updates.get(0).status);

    List<AssetEntity> assets = db.assetDao().loadAllAssets();
    Assert.assertEquals(2, assets.size());
  }

  @Test
  public void testRemoteLoader_AssetExists_DbOnly() {
    // return true when asked if file 54da1e9816c77e30ebc5920e256736f2 exists
    when(mockLoaderFiles.fileExists(any())).thenReturn(false);

    AssetEntity existingAsset = new AssetEntity("54da1e9816c77e30ebc5920e256736f2", "png");
    existingAsset.relativePath = "54da1e9816c77e30ebc5920e256736f2.png";
    db.assetDao()._insertAsset(existingAsset);

    loader.start(mockCallback);

    verify(mockCallback).onSuccess(any());
    verify(mockCallback, times(0)).onFailure(any());

    // both assets should be downloaded regardless of what the database says
    verify(mockFileDownloader, times(2)).downloadAsset(any(), any(), any(), any());

    List<UpdateEntity> updates = db.updateDao().loadAllUpdates();
    Assert.assertEquals(1, updates.size());
    Assert.assertEquals(UpdateStatus.READY, updates.get(0).status);

    List<AssetEntity> assets = db.assetDao().loadAllAssets();
    Assert.assertEquals(2, assets.size());
  }

  @Test
  public void testRemoteLoader_UpdateExists_Ready() {
    UpdateEntity update = new UpdateEntity(
            manifest.getUpdateEntity().id,
            manifest.getUpdateEntity().commitTime,
            manifest.getUpdateEntity().runtimeVersion,
            manifest.getUpdateEntity().scopeKey);
    update.status = UpdateStatus.READY;
    db.updateDao().insertUpdate(update);

    loader.start(mockCallback);

    verify(mockCallback).onSuccess(any());
    verify(mockCallback, times(0)).onFailure(any());
    verify(mockFileDownloader, times(0)).downloadAsset(any(), any(), any(), any());

    List<UpdateEntity> updates = db.updateDao().loadAllUpdates();
    Assert.assertEquals(1, updates.size());
    Assert.assertEquals(UpdateStatus.READY, updates.get(0).status);
  }

  @Test
  public void testRemoteLoader_UpdateExists_Pending() {
    UpdateEntity update = new UpdateEntity(
            manifest.getUpdateEntity().id,
            manifest.getUpdateEntity().commitTime,
            manifest.getUpdateEntity().runtimeVersion,
            manifest.getUpdateEntity().scopeKey);
    update.status = UpdateStatus.PENDING;
    db.updateDao().insertUpdate(update);

    loader.start(mockCallback);

    verify(mockCallback).onSuccess(any());
    verify(mockCallback, times(0)).onFailure(any());

    // missing assets should still be downloaded
    verify(mockFileDownloader, times(2)).downloadAsset(any(), any(), any(), any());

    List<UpdateEntity> updates = db.updateDao().loadAllUpdates();
    Assert.assertEquals(1, updates.size());
    Assert.assertEquals(UpdateStatus.READY, updates.get(0).status);

    List<AssetEntity> assets = db.assetDao().loadAllAssets();
    Assert.assertEquals(2, assets.size());
  }

  @Test
  public void testRemoteLoader_UpdateExists_DifferentScopeKey() {
    UpdateEntity update = new UpdateEntity(
            manifest.getUpdateEntity().id,
            manifest.getUpdateEntity().commitTime,
            manifest.getUpdateEntity().runtimeVersion,
            "differentScopeKey");
    update.status = UpdateStatus.READY;
    db.updateDao().insertUpdate(update);

    loader.start(mockCallback);

    verify(mockCallback).onSuccess(any());
    verify(mockCallback, times(0)).onFailure(any());
    verify(mockFileDownloader, times(0)).downloadAsset(any(), any(), any(), any());

    List<UpdateEntity> updates = db.updateDao().loadAllUpdates();
    Assert.assertEquals(1, updates.size());
    Assert.assertEquals(UpdateStatus.READY, updates.get(0).status);
    Assert.assertEquals(manifest.getUpdateEntity().scopeKey, updates.get(0).scopeKey);
  }

  @Test
  public void testRemoteLoader_DevelopmentModeManifest() throws JSONException {
    manifest = LegacyUpdateManifest.Companion.fromLegacyManifest(
            new LegacyManifest(new JSONObject("{\"name\":\"updates-unit-test-template\",\"slug\":\"updates-unit-test-template\",\"sdkVersion\":\"42.0.0\",\"developer\":{\"tool\":\"expo-cli\",\"projectRoot\":\"/Users/eric/expo/updates-unit-test-template\"},\"packagerOpts\":{\"scheme\":null,\"hostType\":\"lan\",\"lanType\":\"ip\",\"dev\":true,\"minify\":false,\"urlRandomness\":null,\"https\":false},\"mainModuleName\":\"index\",\"debuggerHost\":\"127.0.0.1:19000\",\"logUrl\":\"http://127.0.0.1:19000/logs\",\"hostUri\":\"127.0.0.1:19000\",\"bundleUrl\":\"http://127.0.0.1:19000/index.bundle?platform=ios&dev=true&hot=false&minify=false\"}")),
            configuration
    );
    doAnswer((Answer<Void>) invocation -> {
      FileDownloader.ManifestDownloadCallback callback = invocation.getArgument(3);
      callback.onSuccess(manifest);
      return null;
    }).when(mockFileDownloader).downloadManifest(any(), any(), any(), any());

    loader.start(mockCallback);

    verify(mockCallback).onSuccess(any());
    verify(mockCallback, times(0)).onFailure(any());
    verify(mockFileDownloader, times(0)).downloadAsset(any(), any(), any(), any());

    List<UpdateEntity> updates = db.updateDao().loadAllUpdates();
    Assert.assertEquals(1, updates.size());
    Assert.assertEquals(UpdateStatus.DEVELOPMENT, updates.get(0).status);
  }
}
