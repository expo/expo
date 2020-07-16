package expo.modules.updates.db;

import android.content.Context;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import androidx.room.Room;
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner;
import androidx.test.platform.app.InstrumentationRegistry;
import expo.modules.updates.db.dao.AssetDao;
import expo.modules.updates.db.dao.UpdateDao;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;

@RunWith(AndroidJUnit4ClassRunner.class)
public class UpdatesDatabaseTest {

  private UpdatesDatabase db;
  private UpdateDao updateDao;
  private AssetDao assetDao;

  @Before
  public void createDb() {
    Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
    db = Room.inMemoryDatabaseBuilder(context, UpdatesDatabase.class).build();
    updateDao = db.updateDao();
    assetDao = db.assetDao();
  }

  @After
  public void closeDb() {
    db.close();
  }

  @Test
  public void testInsertUpdate() {
    UUID uuid = UUID.randomUUID();
    Date date = new Date();
    String runtimeVersion = "1.0";
    String projectId = "https://exp.host/@esamelson/test-project";

    UpdateEntity testUpdate = new UpdateEntity(uuid, date, runtimeVersion, projectId);
    updateDao.insertUpdate(testUpdate);
    UpdateEntity byId = updateDao.loadUpdateWithId(uuid);

    Assert.assertNotNull(byId);
    Assert.assertEquals(uuid, byId.id);
    Assert.assertEquals(date, byId.commitTime);
    Assert.assertEquals(runtimeVersion, byId.runtimeVersion);
    Assert.assertEquals(projectId, byId.scopeKey);

    updateDao.deleteUpdates(Arrays.asList(testUpdate));
    Assert.assertEquals(0, updateDao.loadAllUpdatesForScope(projectId).size());
  }

  @Test
  public void testMarkUpdateReady() {
    UUID uuid = UUID.randomUUID();
    Date date = new Date();
    String runtimeVersion = "1.0";
    String projectId = "https://exp.host/@esamelson/test-project";

    UpdateEntity testUpdate = new UpdateEntity(uuid, date, runtimeVersion, projectId);
    updateDao.insertUpdate(testUpdate);
    Assert.assertEquals(0, updateDao.loadLaunchableUpdatesForScope(projectId).size());

    updateDao.markUpdateFinished(testUpdate);
    Assert.assertEquals(1, updateDao.loadLaunchableUpdatesForScope(projectId).size());

    updateDao.deleteUpdates(Arrays.asList(testUpdate));
    Assert.assertEquals(0, updateDao.loadAllUpdatesForScope(projectId).size());
  }

  @Test
  public void testDeleteUnusedAssets() {
    String runtimeVersion = "1.0";
    String projectId = "https://exp.host/@esamelson/test-project";

    UpdateEntity update1 = new UpdateEntity(UUID.randomUUID(), new Date(), runtimeVersion, projectId);
    AssetEntity asset1 = new AssetEntity("asset1", "png");
    AssetEntity commonAsset = new AssetEntity("commonAsset", "png");
    updateDao.insertUpdate(update1);
    assetDao.insertAssets(Arrays.asList(asset1, commonAsset), update1);

    UpdateEntity update2 = new UpdateEntity(UUID.randomUUID(), new Date(), runtimeVersion, projectId);
    AssetEntity asset2 = new AssetEntity("asset2", "png");
    updateDao.insertUpdate(update2);
    assetDao.insertAssets(Arrays.asList(asset2), update2);
    assetDao.addExistingAssetToUpdate(update2, commonAsset, false);

    UpdateEntity update3 = new UpdateEntity(UUID.randomUUID(), new Date(), runtimeVersion, projectId);
    AssetEntity asset3 = new AssetEntity("asset3", "png");
    updateDao.insertUpdate(update3);
    assetDao.insertAssets(Arrays.asList(asset3), update3);
    assetDao.addExistingAssetToUpdate(update3, commonAsset, false);

    // update 1 will be deleted
    // update 2 will have keep = false
    // update 3 will have keep = true
    updateDao.deleteUpdates(Arrays.asList(update1));
    updateDao.markUpdateFinished(update3);

    // check that test has been properly set up
    List<UpdateEntity> allUpdates = updateDao.loadAllUpdatesForScope(projectId);
    Assert.assertEquals(2, allUpdates.size());
    for (UpdateEntity update : allUpdates) {
      if (update.id.equals(update2.id)) {
        Assert.assertFalse(update.keep);
      } else {
        Assert.assertTrue(update.keep);
      }
    }
    Assert.assertNotNull(assetDao.loadAssetWithKey("asset1"));
    Assert.assertNotNull(assetDao.loadAssetWithKey("asset2"));
    Assert.assertNotNull(assetDao.loadAssetWithKey("asset3"));
    Assert.assertNotNull(assetDao.loadAssetWithKey("commonAsset"));

    assetDao.deleteUnusedAssets();

    Assert.assertNull(assetDao.loadAssetWithKey("asset1"));
    Assert.assertNull(assetDao.loadAssetWithKey("asset2"));
    Assert.assertNotNull(assetDao.loadAssetWithKey("asset3"));
    Assert.assertNotNull(assetDao.loadAssetWithKey("commonAsset"));
  }
}
