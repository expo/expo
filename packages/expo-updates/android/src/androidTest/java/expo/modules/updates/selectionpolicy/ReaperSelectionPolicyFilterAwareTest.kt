package expo.modules.updates.selectionpolicy

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import expo.modules.updates.db.entity.UpdateEntity
import org.json.JSONObject
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import java.util.*

@RunWith(AndroidJUnit4ClassRunner::class)
class ReaperSelectionPolicyFilterAwareTest {
  private val runtimeVersion = "1.0"
  private val scopeKey = "dummyScope"
  private val update1 = UpdateEntity(UUID.randomUUID(), Date(1608667857774L), runtimeVersion, scopeKey, JSONObject("{}"))
  private val update2 = UpdateEntity(UUID.randomUUID(), Date(1608667857775L), runtimeVersion, scopeKey, JSONObject("{}"))
  private val update3 = UpdateEntity(UUID.randomUUID(), Date(1608667857776L), runtimeVersion, scopeKey, JSONObject("{}"))
  private val update4 = UpdateEntity(UUID.randomUUID(), Date(1608667857777L), runtimeVersion, scopeKey, JSONObject("{}"))
  private val update5 = UpdateEntity(UUID.randomUUID(), Date(1608667857778L), runtimeVersion, scopeKey, JSONObject("{}"))
  private val selectionPolicy: ReaperSelectionPolicy = ReaperSelectionPolicyFilterAware()

  @Test
  fun testSelectUpdatesToDelete_onlyOneUpdate() {
    val updatesToDelete = selectionPolicy.selectUpdatesToDelete(listOf(update1), update1, null)
    Assert.assertEquals(0, updatesToDelete.size.toLong())
  }

  @Test
  fun testSelectUpdatesToDelete_olderUpdates() {
    val updatesToDelete = selectionPolicy.selectUpdatesToDelete(
      listOf(update1, update2, update3),
      update3,
      null
    )
    Assert.assertEquals(1, updatesToDelete.size.toLong())
    Assert.assertTrue(updatesToDelete.contains(update1))
    Assert.assertFalse(updatesToDelete.contains(update2))
    Assert.assertFalse(updatesToDelete.contains(update3))
  }

  @Test
  fun testSelectUpdatesToDelete_newerUpdates() {
    val updatesToDelete = selectionPolicy.selectUpdatesToDelete(
      listOf(update1, update2),
      update1,
      null
    )
    Assert.assertEquals(0, updatesToDelete.size.toLong())
  }

  @Test
  fun testSelectUpdatesToDelete_olderAndNewerUpdates() {
    val updatesToDelete = selectionPolicy.selectUpdatesToDelete(
      listOf(update1, update2, update3, update4, update5),
      update4,
      null
    )
    Assert.assertEquals(2, updatesToDelete.size.toLong())
    Assert.assertTrue(updatesToDelete.contains(update1))
    Assert.assertTrue(updatesToDelete.contains(update2))
    Assert.assertFalse(updatesToDelete.contains(update3))
    Assert.assertFalse(updatesToDelete.contains(update4))
    Assert.assertFalse(updatesToDelete.contains(update5))
  }

  @Test
  fun testSelectUpdatesToDelete_differentScopeKey() {
    val update4DifferentScope =
      UpdateEntity(update4.id, update4.commitTime, update4.runtimeVersion, "differentScopeKey", JSONObject("{}"))
    val updatesToDelete = selectionPolicy.selectUpdatesToDelete(
      listOf(update1, update2, update3, update4DifferentScope),
      update4DifferentScope,
      null
    )

    // shouldn't delete any updates whose scope key doesn't match that of `launchedUpdate`
    Assert.assertEquals(0, updatesToDelete.size.toLong())
  }
}
