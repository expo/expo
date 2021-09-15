package expo.modules.updates.db;

import android.content.Context;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;

import androidx.room.Room;
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner;
import androidx.test.platform.app.InstrumentationRegistry;

import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.db.enums.UpdateStatus;

@RunWith(AndroidJUnit4ClassRunner.class)
public class DatabaseIntegrityCheckTest {

  private Context context;
  private UpdatesDatabase db;

  @Before
  public void createDb() {
    context = InstrumentationRegistry.getInstrumentation().getTargetContext();
    db = Room.inMemoryDatabaseBuilder(context, UpdatesDatabase.class).build();
  }

  @After
  public void closeDb() {
    db.close();
  }

  @Test
  public void testFilterEmbeddedUpdates() {
    // We can't run any updates with the status EMBEDDED if they aren't the update that's
    // currently embedded in the installed app; the integrity check should remove any such updates
    // from the database entirely.

    String scopeKey = "testScopeKey";
    UpdateEntity embeddedUpdate1 = new UpdateEntity(UUID.randomUUID(), new Date(1608667857774L), "1.0", scopeKey);
    embeddedUpdate1.status = UpdateStatus.EMBEDDED;
    UpdateEntity embeddedUpdate2 = new UpdateEntity(UUID.randomUUID(), new Date(1608667857775L), "1.0", scopeKey);
    embeddedUpdate2.status = UpdateStatus.EMBEDDED;

    db.updateDao().insertUpdate(embeddedUpdate1);
    db.updateDao().insertUpdate(embeddedUpdate2);

    Assert.assertEquals(2, db.updateDao().loadAllUpdates().size());

    new DatabaseIntegrityCheck().run(db, null, embeddedUpdate2);

    List<UpdateEntity> allUpdates = db.updateDao().loadAllUpdates();
    Assert.assertEquals(1, allUpdates.size());
    Assert.assertEquals(embeddedUpdate2.id, allUpdates.get(0).id);

    // cleanup
    db.updateDao().deleteUpdates(allUpdates);
  }

  @Test
  public void testMissingAssets() {
    AssetEntity asset1 = new AssetEntity("asset1", "png");
    asset1.relativePath = "asset1.png";

    String scopeKey = "testScopeKey";
    UpdateEntity update1 = new UpdateEntity(UUID.randomUUID(), new Date(), "1.0", scopeKey);
    update1.status = UpdateStatus.READY;

    db.updateDao().insertUpdate(update1);
    db.assetDao().insertAssets(Collections.singletonList(asset1), update1);

    Assert.assertEquals(1, db.updateDao().loadAllUpdates().size());
    Assert.assertEquals(1, db.assetDao().loadAllAssets().size());

    DatabaseIntegrityCheck integrityCheck = Mockito.spy(DatabaseIntegrityCheck.class);
    Mockito.doReturn(false).when(integrityCheck).assetExists(ArgumentMatchers.any(), ArgumentMatchers.any());
    integrityCheck.run(db, context.getCacheDir(), update1);

    List<UpdateEntity> allUpdates = db.updateDao().loadAllUpdates();
    List<AssetEntity> allAssets = db.assetDao().loadAllAssets();
    Assert.assertEquals(1, allUpdates.size());
    Assert.assertEquals(UpdateStatus.PENDING, allUpdates.get(0).status);
    Assert.assertEquals(1, allAssets.size());

    // cleanup
    db.updateDao().deleteUpdates(allUpdates);
  }

  @Test
  public void testNoMissingAssets() {
    AssetEntity asset1 = new AssetEntity("asset1", "png");
    asset1.relativePath = "asset1.png";

    String scopeKey = "testScopeKey";
    UpdateEntity update1 = new UpdateEntity(UUID.randomUUID(), new Date(), "1.0", scopeKey);
    update1.status = UpdateStatus.READY;

    db.updateDao().insertUpdate(update1);
    db.assetDao().insertAssets(Collections.singletonList(asset1), update1);

    Assert.assertEquals(1, db.updateDao().loadAllUpdates().size());
    Assert.assertEquals(1, db.assetDao().loadAllAssets().size());

    DatabaseIntegrityCheck integrityCheck = Mockito.spy(DatabaseIntegrityCheck.class);
    Mockito.doReturn(true).when(integrityCheck).assetExists(ArgumentMatchers.any(), ArgumentMatchers.any());
    integrityCheck.run(db, context.getCacheDir(), update1);

    List<UpdateEntity> allUpdates = db.updateDao().loadAllUpdates();
    List<AssetEntity> allAssets = db.assetDao().loadAllAssets();
    Assert.assertEquals(1, allUpdates.size());
    Assert.assertEquals(UpdateStatus.READY, allUpdates.get(0).status);
    Assert.assertEquals(1, allAssets.size());

    // cleanup
    db.updateDao().deleteUpdates(allUpdates);
  }
}
