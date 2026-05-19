package expo.modules.updates.selectionpolicy

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.db.enums.UpdateStatus
import org.json.JSONObject
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import java.util.Date
import java.util.UUID

@RunWith(AndroidJUnit4ClassRunner::class)
class ReaperSelectionPolicyFilterAwareTest {
  private val runtimeVersion = "1.0"
  private val scopeKey = "dummyScope"

  @Test
  fun `should keep launched update and one older update by default`() {
    val update1 = createUpdate(1608667857774L)
    val update2 = createUpdate(1608667857775L)
    val launchedUpdate = createUpdate(1608667857776L)
    val selectionPolicy: ReaperSelectionPolicy = ReaperSelectionPolicyFilterAware()

    val updatesToDelete = selectionPolicy.selectUpdatesToDelete(
      listOf(update1, update2, launchedUpdate),
      launchedUpdate,
      null
    )

    Assert.assertEquals(1, updatesToDelete.size)
    Assert.assertTrue(updatesToDelete.contains(update1))
    Assert.assertFalse(updatesToDelete.contains(update2))
    Assert.assertFalse(updatesToDelete.contains(launchedUpdate))
  }

  @Test
  fun `should keep configured max updates when older updates exist`() {
    val update1 = createUpdate(1608667857774L)
    val update2 = createUpdate(1608667857775L)
    val update3 = createUpdate(1608667857776L)
    val launchedUpdate = createUpdate(1608667857777L)
    val selectionPolicy: ReaperSelectionPolicy = ReaperSelectionPolicyFilterAware(maxUpdatesToKeep = 3)

    val updatesToDelete = selectionPolicy.selectUpdatesToDelete(
      listOf(update1, update2, update3, launchedUpdate),
      launchedUpdate,
      null
    )

    Assert.assertEquals(1, updatesToDelete.size)
    Assert.assertTrue(updatesToDelete.contains(update1))
    Assert.assertFalse(updatesToDelete.contains(update2))
    Assert.assertFalse(updatesToDelete.contains(update3))
    Assert.assertFalse(updatesToDelete.contains(launchedUpdate))
  }

  @Test
  fun `should reject maxUpdatesToKeep below two`() {
    Assert.assertThrows(AssertionError::class.java) {
      ReaperSelectionPolicyFilterAware(maxUpdatesToKeep = 1)
    }
  }

  @Test
  fun `should not delete newer updates`() {
    val launchedUpdate = createUpdate(1608667857774L)
    val newerUpdate = createUpdate(1608667857775L)
    val selectionPolicy: ReaperSelectionPolicy = ReaperSelectionPolicyFilterAware()

    val updatesToDelete = selectionPolicy.selectUpdatesToDelete(
      listOf(launchedUpdate, newerUpdate),
      launchedUpdate,
      null
    )

    Assert.assertEquals(0, updatesToDelete.size)
  }

  @Test
  fun `should prefer older updates matching manifest filters`() {
    val oldestMatchingUpdate = createUpdate(1608667857774L, branchName = "rollout")
    val olderDefaultUpdate = createUpdate(1608667857775L, branchName = "default")
    val nextNewestMatchingUpdate = createUpdate(1608667857776L, branchName = "rollout")
    val newestDefaultUpdate = createUpdate(1608667857777L, branchName = "default")
    val launchedUpdate = createUpdate(1608667857778L, branchName = "rollout")
    val selectionPolicy: ReaperSelectionPolicy = ReaperSelectionPolicyFilterAware(maxUpdatesToKeep = 3)

    val updatesToDelete = selectionPolicy.selectUpdatesToDelete(
      listOf(oldestMatchingUpdate, olderDefaultUpdate, nextNewestMatchingUpdate, newestDefaultUpdate, launchedUpdate),
      launchedUpdate,
      JSONObject("{\"branchname\":\"rollout\"}")
    )

    Assert.assertEquals(2, updatesToDelete.size)
    Assert.assertFalse(updatesToDelete.contains(oldestMatchingUpdate))
    Assert.assertTrue(updatesToDelete.contains(olderDefaultUpdate))
    Assert.assertFalse(updatesToDelete.contains(nextNewestMatchingUpdate))
    Assert.assertTrue(updatesToDelete.contains(newestDefaultUpdate))
    Assert.assertFalse(updatesToDelete.contains(launchedUpdate))
  }

  @Test
  fun `should fill remaining retained slots with newest older updates`() {
    val matchingUpdate = createUpdate(1608667857774L, branchName = "rollout")
    val olderDefaultUpdate = createUpdate(1608667857775L, branchName = "default")
    val newerDefaultUpdate = createUpdate(1608667857776L, branchName = "default")
    val launchedUpdate = createUpdate(1608667857777L, branchName = "rollout")
    val selectionPolicy: ReaperSelectionPolicy = ReaperSelectionPolicyFilterAware(maxUpdatesToKeep = 3)

    val updatesToDelete = selectionPolicy.selectUpdatesToDelete(
      listOf(matchingUpdate, olderDefaultUpdate, newerDefaultUpdate, launchedUpdate),
      launchedUpdate,
      JSONObject("{\"branchname\":\"rollout\"}")
    )

    Assert.assertEquals(1, updatesToDelete.size)
    Assert.assertFalse(updatesToDelete.contains(matchingUpdate))
    Assert.assertTrue(updatesToDelete.contains(olderDefaultUpdate))
    Assert.assertFalse(updatesToDelete.contains(newerDefaultUpdate))
    Assert.assertFalse(updatesToDelete.contains(launchedUpdate))
  }

  @Test
  fun `should not delete updates from other scopes`() {
    val update1 = createUpdate(1608667857774L)
    val update2 = createUpdate(1608667857775L)
    val launchedUpdate = createUpdate(1608667857776L, scopeKey = "differentScopeKey")
    val selectionPolicy: ReaperSelectionPolicy = ReaperSelectionPolicyFilterAware()

    val updatesToDelete = selectionPolicy.selectUpdatesToDelete(
      listOf(update1, update2, launchedUpdate),
      launchedUpdate,
      null
    )

    Assert.assertEquals(0, updatesToDelete.size)
  }

  @Test
  fun `should not delete embedded updates`() {
    val embeddedUpdate = createUpdate(1608667857774L, status = UpdateStatus.EMBEDDED)
    val olderUpdate = createUpdate(1608667857775L)
    val launchedUpdate = createUpdate(1608667857776L)
    val selectionPolicy: ReaperSelectionPolicy = ReaperSelectionPolicyFilterAware()

    val updatesToDelete = selectionPolicy.selectUpdatesToDelete(
      listOf(embeddedUpdate, olderUpdate, launchedUpdate),
      launchedUpdate,
      null
    )

    Assert.assertEquals(0, updatesToDelete.size)
  }

  private fun createUpdate(
    commitTime: Long,
    scopeKey: String = this.scopeKey,
    branchName: String? = null,
    status: UpdateStatus = UpdateStatus.READY
  ): UpdateEntity {
    val manifest = branchName?.let {
      JSONObject("{\"metadata\":{\"branchName\":\"$it\"}}")
    } ?: JSONObject("{}")
    return UpdateEntity(UUID.randomUUID(), Date(commitTime), runtimeVersion, scopeKey, manifest, null, null).apply {
      this.status = status
    }
  }
}
