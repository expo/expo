package expo.modules.updates.selectionpolicy;

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import expo.modules.updates.db.entity.UpdateEntity;

@RunWith(AndroidJUnit4ClassRunner.class)
public class ReaperSelectionPolicyFilterAwareTest {
  String runtimeVersion = "1.0";
  String scopeKey = "dummyScope";
  UpdateEntity update1 = new UpdateEntity(UUID.randomUUID(), new Date(1608667857774L), runtimeVersion, scopeKey);
  UpdateEntity update2 = new UpdateEntity(UUID.randomUUID(), new Date(1608667857775L), runtimeVersion, scopeKey);
  UpdateEntity update3 = new UpdateEntity(UUID.randomUUID(), new Date(1608667857776L), runtimeVersion, scopeKey);
  UpdateEntity update4 = new UpdateEntity(UUID.randomUUID(), new Date(1608667857777L), runtimeVersion, scopeKey);
  UpdateEntity update5 = new UpdateEntity(UUID.randomUUID(), new Date(1608667857778L), runtimeVersion, scopeKey);
  ReaperSelectionPolicy selectionPolicy = new ReaperSelectionPolicyFilterAware();

  @Test
  public void testSelectUpdatesToDelete_onlyOneUpdate() {
    List<UpdateEntity> updatesToDelete = selectionPolicy.selectUpdatesToDelete(Collections.singletonList(update1), update1, null);

    Assert.assertEquals(0, updatesToDelete.size());
  }

  @Test
  public void testSelectUpdatesToDelete_olderUpdates() {
    List<UpdateEntity> updatesToDelete = selectionPolicy.selectUpdatesToDelete(
            Arrays.asList(update1, update2, update3),
            update3,
            null);

    Assert.assertEquals(1, updatesToDelete.size());
    Assert.assertTrue(updatesToDelete.contains(update1));
    Assert.assertFalse(updatesToDelete.contains(update2));
    Assert.assertFalse(updatesToDelete.contains(update3));
  }

  @Test
  public void testSelectUpdatesToDelete_newerUpdates() {
    List<UpdateEntity> updatesToDelete = selectionPolicy.selectUpdatesToDelete(
            Arrays.asList(update1, update2),
            update1,
            null);

    Assert.assertEquals(0, updatesToDelete.size());
  }

  @Test
  public void testSelectUpdatesToDelete_olderAndNewerUpdates() {
    List<UpdateEntity> updatesToDelete = selectionPolicy.selectUpdatesToDelete(
            Arrays.asList(update1, update2, update3, update4, update5),
            update4,
            null);

    Assert.assertEquals(2, updatesToDelete.size());
    Assert.assertTrue(updatesToDelete.contains(update1));
    Assert.assertTrue(updatesToDelete.contains(update2));
    Assert.assertFalse(updatesToDelete.contains(update3));
    Assert.assertFalse(updatesToDelete.contains(update4));
    Assert.assertFalse(updatesToDelete.contains(update5));
  }

  @Test
  public void testSelectUpdatesToDelete_differentScopeKey() {
    UpdateEntity update4DifferentScope = new UpdateEntity(update4.id, update4.commitTime, update4.runtimeVersion, "differentScopeKey");
    List<UpdateEntity> updatesToDelete = selectionPolicy.selectUpdatesToDelete(
            Arrays.asList(update1, update2, update3, update4DifferentScope),
            update4DifferentScope,
            null);

    // shouldn't delete any updates whose scope key doesn't match that of `launchedUpdate`
    Assert.assertEquals(0, updatesToDelete.size());
  }
}
