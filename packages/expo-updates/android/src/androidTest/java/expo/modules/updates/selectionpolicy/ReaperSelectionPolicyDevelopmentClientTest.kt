package expo.modules.updates.selectionpolicy

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import expo.modules.updates.db.entity.UpdateEntity
import org.json.JSONObject
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import java.util.*

@RunWith(AndroidJUnit4ClassRunner::class)
class ReaperSelectionPolicyDevelopmentClientTest {
  private val runtimeVersion = "1.0"

  // test updates with different scopes to ensure this policy ignores scopes
  private val update1 = UpdateEntity(UUID.randomUUID(), Date(1608667857774L), runtimeVersion, "scope1", JSONObject("{}"))
  private val update2 = UpdateEntity(UUID.randomUUID(), Date(1608667857775L), runtimeVersion, "scope2", JSONObject("{}"))
  private val update3 = UpdateEntity(UUID.randomUUID(), Date(1608667857776L), runtimeVersion, "scope3", JSONObject("{}"))
  private val update4 = UpdateEntity(UUID.randomUUID(), Date(1608667857777L), runtimeVersion, "scope4", JSONObject("{}"))
  private val update5 = UpdateEntity(UUID.randomUUID(), Date(1608667857778L), runtimeVersion, "scope5", JSONObject("{}"))

  // for readability/writability, test with a policy that keeps only 3 updates;
  // the actual functionality is independent of the number
  private val selectionPolicy: ReaperSelectionPolicy = ReaperSelectionPolicyDevelopmentClient(3)

  @Test
  fun testSelectUpdatesToDelete_BasicCase() {
    update1.lastAccessed = Date(1619569813251L)
    update2.lastAccessed = Date(1619569813252L)
    update3.lastAccessed = Date(1619569813253L)
    update4.lastAccessed = Date(1619569813254L)
    update5.lastAccessed = Date(1619569813255L)
    val updatesToDelete =
      selectionPolicy.selectUpdatesToDelete( // the order of the list shouldn't matter
        listOf(update2, update5, update4, update1, update3),
        update5,
        null
      )
    Assert.assertEquals(2, updatesToDelete.size)
    Assert.assertTrue(updatesToDelete.contains(update1))
    Assert.assertTrue(updatesToDelete.contains(update2))
  }

  @Test
  fun testSelectUpdatesToDelete_SameLastAccessedDate() {
    // if multiple updates have the same lastAccessed date, should use commitTime to determine
    // which updates to delete
    update1.lastAccessed = Date(1619569813250L)
    update2.lastAccessed = Date(1619569813250L)
    update3.lastAccessed = Date(1619569813250L)
    update4.lastAccessed = Date(1619569813250L)
    val updatesToDelete = selectionPolicy.selectUpdatesToDelete(
      listOf(update3, update4, update1, update2),
      update4,
      null
    )
    Assert.assertEquals(1, updatesToDelete.size)
    Assert.assertTrue(updatesToDelete.contains(update1))
  }

  @Test
  fun testSelectUpdatesToDelete_LaunchedUpdateIsOldest() {
    // if the least recently accessed update happens to be launchedUpdate, delete instead the next
    // least recently accessed update
    update1.lastAccessed = Date(1619569813251L)
    update2.lastAccessed = Date(1619569813252L)
    update3.lastAccessed = Date(1619569813253L)
    update4.lastAccessed = Date(1619569813254L)
    val updatesToDelete = selectionPolicy.selectUpdatesToDelete(
      listOf(update1, update2, update3, update4),
      update1,
      null
    )
    Assert.assertEquals(1, updatesToDelete.size)
    Assert.assertTrue(updatesToDelete.contains(update2))
  }

  @Test
  fun testSelectUpdatesToDelete_NoLaunchedUpdate() {
    // if launchedUpdate is null, something has gone wrong, so don't delete anything
    val updatesToDelete = selectionPolicy.selectUpdatesToDelete(
      listOf(update1, update2, update3, update4),
      null,
      null
    )
    Assert.assertEquals(0, updatesToDelete.size)
  }

  @Test
  fun testSelectUpdatesToDelete_BelowMaxNumber() {
    // no need to delete any updates if we have <= the max number of updates
    Assert.assertEquals(
      0,
      selectionPolicy.selectUpdatesToDelete(
        listOf(update1, update2),
        update2,
        null
      ).size
    )
    Assert.assertEquals(
      0,
      selectionPolicy.selectUpdatesToDelete(
        listOf(update1, update2, update3),
        update3,
        null
      ).size
    )
  }
}
