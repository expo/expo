package expo.modules.updates.selectionpolicy

import android.net.Uri
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import expo.modules.updates.UpdatesConfiguration
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
  fun shouldKeepLaunchedUpdateAndOneOlderUpdateByDefault() {
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
  fun shouldKeepConfiguredMaxUpdatesWhenOlderUpdatesExist() {
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
  fun shouldRejectMaxUpdatesToKeepBelowTwo() {
    Assert.assertThrows(AssertionError::class.java) {
      ReaperSelectionPolicyFilterAware(maxUpdatesToKeep = 1)
    }
  }

  @Test
  fun shouldNotDeleteNewerUpdates() {
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
  fun shouldPreferOlderUpdatesMatchingManifestFilters() {
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
  fun shouldFillRemainingRetainedSlotsWithNewestOlderUpdates() {
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
  fun shouldNotDeleteUpdatesFromOtherScopes() {
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
  fun shouldNotDeleteEmbeddedUpdates() {
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

  @Test
  fun shouldKeepEverythingWithoutALaunchedUpdate() {
    val updates = listOf(createUpdate(1), createUpdate(2))
    Assert.assertTrue(ReaperSelectionPolicyFilterAware().selectUpdatesToDelete(updates, null, null).isEmpty())
  }

  @Test
  fun shouldKeepEverythingWhenRetentionExceedsAvailableUpdates() {
    val updates = (1L..4L).map { createUpdate(it) }
    Assert.assertTrue(
      ReaperSelectionPolicyFilterAware(Int.MAX_VALUE).selectUpdatesToDelete(updates, updates.last(), null).isEmpty()
    )
  }

  @Test
  fun shouldSelectNewestFallbacksIndependentlyOfInputOrder() {
    val updates = (1L..6L).map { createUpdate(it, branchName = "default") }
    val launchedUpdate = createUpdate(7, branchName = "rollout")
    val input = listOf(updates[3], updates[0], launchedUpdate, updates[5], updates[2], updates[4], updates[1])
    val deleted = ReaperSelectionPolicyFilterAware(4).selectUpdatesToDelete(
      input,
      launchedUpdate,
      JSONObject("{\"branchname\":\"rollout\"}")
    )
    Assert.assertEquals(listOf(updates[0], updates[2], updates[1]), deleted)
    Assert.assertEquals(7, input.size)
  }

  @Test
  fun shouldPreserveEqualTimeNewerEmbeddedAndOtherScopeUpdatesWithAFullCache() {
    val olderUpdates = (1L..4L).map { createUpdate(it) }
    val launchedUpdate = createUpdate(5)
    val protectedUpdates = listOf(
      createUpdate(5),
      createUpdate(6),
      createUpdate(0, status = UpdateStatus.EMBEDDED),
      createUpdate(0, scopeKey = "other")
    )
    val deleted = ReaperSelectionPolicyFilterAware(3).selectUpdatesToDelete(
      olderUpdates + protectedUpdates + launchedUpdate,
      launchedUpdate,
      null
    )
    Assert.assertEquals(olderUpdates.take(2), deleted)
  }

  @Test
  fun shouldRetainPreferredAndFallbackUpdatesInALargeMixedCache() {
    val matching = (1L..500L).map { createUpdate(it, branchName = "rollout") }
    val nonmatching = (501L..2000L).map { createUpdate(it, branchName = "default") }
    val launchedUpdate = createUpdate(2001)
    val deleted = ReaperSelectionPolicyFilterAware(1001).selectUpdatesToDelete(
      (matching + nonmatching + launchedUpdate).reversed(),
      launchedUpdate,
      JSONObject("{\"branchname\":\"rollout\"}")
    )
    Assert.assertEquals(nonmatching.take(1000).reversed(), deleted)
  }

  @Test
  fun factoryShouldPassConfiguredRetentionToTheReaper() {
    val config = UpdatesConfiguration(
      null,
      mapOf(
        UpdatesConfiguration.UPDATES_CONFIGURATION_UPDATE_URL_KEY to Uri.parse("https://example.com"),
        UpdatesConfiguration.UPDATES_CONFIGURATION_MAX_UPDATES_TO_KEEP_KEY to 3
      )
    )
    val updates = (1L..4L).map { createUpdate(it) }
    val policy = SelectionPolicyFactory.createFilterAwarePolicy(runtimeVersion, config)
    Assert.assertEquals(listOf(updates.first()), policy.selectUpdatesToDelete(updates, updates.last(), null))
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
