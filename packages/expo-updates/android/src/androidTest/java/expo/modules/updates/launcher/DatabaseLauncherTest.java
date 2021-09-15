package expo.modules.updates.launcher;

import android.content.Context;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;

import java.io.File;
import java.util.Collections;
import java.util.Date;
import java.util.UUID;

import androidx.room.Room;
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner;
import androidx.test.platform.app.InstrumentationRegistry;

import expo.modules.updates.db.UpdatesDatabase;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;

@RunWith(AndroidJUnit4ClassRunner.class)
public class DatabaseLauncherTest {
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
  public void testLaunch_MarkUpdateAccessed() {
    UpdateEntity testUpdate = new UpdateEntity(UUID.randomUUID(), new Date(), "1.0", "scopeKey");
    testUpdate.lastAccessed = new Date(new Date().getTime() - 24 * 60 * 60 * 1000); // yesterday
    db.updateDao().insertUpdate(testUpdate);

    AssetEntity testAsset = new AssetEntity("bundle-1234", "js");
    testAsset.relativePath = "bundle-1234";
    testAsset.isLaunchAsset = true;
    db.assetDao().insertAssets(Collections.singletonList(testAsset), testUpdate);

    DatabaseLauncher launcher = new DatabaseLauncher(null, null, null, null);
    DatabaseLauncher spyLauncher = Mockito.spy(launcher);
    Mockito.doReturn(db.updateDao().loadUpdateWithId(testUpdate.id))
            .when(spyLauncher).getLaunchableUpdate(ArgumentMatchers.any(), ArgumentMatchers.any());

    File mockedFile = new File(context.getCacheDir(), "test");
    Mockito.doReturn(mockedFile).when(spyLauncher).ensureAssetExists(ArgumentMatchers.any(), ArgumentMatchers.any(), ArgumentMatchers.any());

    Launcher.LauncherCallback mockedCallback = Mockito.mock(Launcher.LauncherCallback.class);
    spyLauncher.launch(db, context, mockedCallback);
    Mockito.verify(mockedCallback).onSuccess();

    UpdateEntity sameUpdate = db.updateDao().loadUpdateWithId(testUpdate.id);
    Assert.assertNotEquals(testUpdate.lastAccessed, sameUpdate.lastAccessed);
    Assert.assertTrue("new lastAccessed date should be within 1000 ms of now", new Date().getTime() - sameUpdate.lastAccessed.getTime() < 1000);
  }
}
