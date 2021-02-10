package expo.modules.updates.launcher;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner;
import expo.modules.updates.db.entity.UpdateEntity;

@RunWith(AndroidJUnit4ClassRunner.class)
public class SelectionPolicyNewestTest {
  String runtimeVersion = "1.0";
  String scopeKey = "dummyScope";
  UpdateEntity update1 = new UpdateEntity(UUID.randomUUID(), new Date(1608667857774L), runtimeVersion, scopeKey);
  UpdateEntity update2 = new UpdateEntity(UUID.randomUUID(), new Date(1608667857775L), runtimeVersion, scopeKey);
  UpdateEntity update3 = new UpdateEntity(UUID.randomUUID(), new Date(1608667857776L), runtimeVersion, scopeKey);
  UpdateEntity update4 = new UpdateEntity(UUID.randomUUID(), new Date(1608667857777L), runtimeVersion, scopeKey);
  UpdateEntity update5 = new UpdateEntity(UUID.randomUUID(), new Date(1608667857778L), runtimeVersion, scopeKey);
  SelectionPolicy selectionPolicy = new SelectionPolicyNewest(runtimeVersion);

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
}
