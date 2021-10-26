package expo.modules.updates.selectionpolicy;

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import expo.modules.updates.UpdatesConfiguration;
import expo.modules.updates.db.entity.UpdateEntity;

@RunWith(AndroidJUnit4ClassRunner.class)
public class ReaperSelectionPolicyDevelopmentClientTest {
  String runtimeVersion = "1.0";

  // test updates with different scopes to ensure this policy ignores scopes
  UpdateEntity update1 = new UpdateEntity(UUID.randomUUID(), new Date(1608667857774L), runtimeVersion, "scope1");
  UpdateEntity update2 = new UpdateEntity(UUID.randomUUID(), new Date(1608667857775L), runtimeVersion, "scope2");
  UpdateEntity update3 = new UpdateEntity(UUID.randomUUID(), new Date(1608667857776L), runtimeVersion, "scope3");
  UpdateEntity update4 = new UpdateEntity(UUID.randomUUID(), new Date(1608667857777L), runtimeVersion, "scope4");
  UpdateEntity update5 = new UpdateEntity(UUID.randomUUID(), new Date(1608667857778L), runtimeVersion, "scope5");

  // for readability/writability, test with a policy that keeps only 3 updates;
  // the actual functionality is independent of the number
  ReaperSelectionPolicy selectionPolicy = new ReaperSelectionPolicyDevelopmentClient(3);

  @Test
  public void testSelectUpdatesToDelete_BasicCase() {
    update1.lastAccessed = new Date(1619569813251L);
    update2.lastAccessed = new Date(1619569813252L);
    update3.lastAccessed = new Date(1619569813253L);
    update4.lastAccessed = new Date(1619569813254L);
    update5.lastAccessed = new Date(1619569813255L);

    List<UpdateEntity> updatesToDelete = selectionPolicy.selectUpdatesToDelete(
            // the order of the list shouldn't matter
            Arrays.asList(update2, update5, update4, update1, update3),
            update5,
            null,new UpdatesConfiguration());

    Assert.assertEquals(2, updatesToDelete.size());
    Assert.assertTrue(updatesToDelete.contains(update1));
    Assert.assertTrue(updatesToDelete.contains(update2));
  }

  @Test
  public void testSelectUpdatesToDelete_SameLastAccessedDate() {
    // if multiple updates have the same lastAccessed date, should use commitTime to determine
    // which updates to delete
    update1.lastAccessed = new Date(1619569813250L);
    update2.lastAccessed = new Date(1619569813250L);
    update3.lastAccessed = new Date(1619569813250L);
    update4.lastAccessed = new Date(1619569813250L);

    List<UpdateEntity> updatesToDelete = selectionPolicy.selectUpdatesToDelete(
            Arrays.asList(update3, update4, update1, update2),
            update4,
            null,new UpdatesConfiguration());

    Assert.assertEquals(1, updatesToDelete.size());
    Assert.assertTrue(updatesToDelete.contains(update1));
  }

  @Test
  public void testSelectUpdatesToDelete_LaunchedUpdateIsOldest() {
    // if the least recently accessed update happens to be launchedUpdate, delete instead the next
    // least recently accessed update
    update1.lastAccessed = new Date(1619569813251L);
    update2.lastAccessed = new Date(1619569813252L);
    update3.lastAccessed = new Date(1619569813253L);
    update4.lastAccessed = new Date(1619569813254L);

    List<UpdateEntity> updatesToDelete = selectionPolicy.selectUpdatesToDelete(
            Arrays.asList(update1, update2, update3, update4),
            update1,
            null,new UpdatesConfiguration());

    Assert.assertEquals(1, updatesToDelete.size());
    Assert.assertTrue(updatesToDelete.contains(update2));
  }

  @Test
  public void testSelectUpdatesToDelete_NoLaunchedUpdate() {
    // if launchedUpdate is null, something has gone wrong, so don't delete anything
    List<UpdateEntity> updatesToDelete = selectionPolicy.selectUpdatesToDelete(
            Arrays.asList(update1, update2, update3, update4),
            null,
            null,new UpdatesConfiguration());
    Assert.assertEquals(0, updatesToDelete.size());
  }

  @Test
  public void testSelectUpdatesToDelete_BelowMaxNumber() {
    // no need to delete any updates if we have <= the max number of updates
    Assert.assertEquals(0, selectionPolicy.selectUpdatesToDelete(
            Arrays.asList(update1, update2),
            update2,
            null,new UpdatesConfiguration()).size());
    Assert.assertEquals(0, selectionPolicy.selectUpdatesToDelete(
            Arrays.asList(update1, update2, update3),
            update3,
            null,new UpdatesConfiguration()).size());
  }
}
