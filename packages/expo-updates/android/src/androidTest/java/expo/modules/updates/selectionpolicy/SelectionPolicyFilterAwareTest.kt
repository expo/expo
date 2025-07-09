package expo.modules.updates.selectionpolicy

import android.net.Uri
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import expo.modules.manifests.core.ExpoUpdatesManifest
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.loader.UpdateDirective
import expo.modules.updates.manifest.ExpoUpdatesUpdate
import org.json.JSONException
import org.json.JSONObject
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import java.util.Date

@RunWith(AndroidJUnit4ClassRunner::class)
class SelectionPolicyFilterAwareTest {
  private val config = UpdatesConfiguration(null, mapOf<String, Any>("updateUrl" to Uri.parse("https://exp.host/@test/test")))
  private val manifestFilters = JSONObject("{\"branchname\": \"rollout\"}")
  private val selectionPolicy = SelectionPolicyFactory.createFilterAwarePolicy("1.0")
  private val updateRollout0 = ExpoUpdatesManifest(JSONObject("{\"id\":\"079cde35-8433-4c17-81c8-7117c1513e71\",\"createdAt\":\"2021-01-10T19:39:22.480Z\",\"runtimeVersion\":\"1.0\",\"launchAsset\":{\"hash\":\"DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA\",\"key\":\"0436e5821bff7b95a84c21f22a43cb96.bundle\",\"contentType\":\"application/javascript\",\"url\":\"https://url.to/bundle\"},\"assets\":[{\"hash\":\"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo\",\"key\":\"3261e570d51777be1e99116562280926.png\",\"contentType\":\"image/png\",\"url\":\"https://url.to/asset\"}],\"metadata\":{\"branchName\":\"rollout\"}}")).let {
    ExpoUpdatesUpdate.fromExpoUpdatesManifest(it, null, config).updateEntity
  }
  private val updateDefault1 = ExpoUpdatesManifest(JSONObject("{\"id\":\"079cde35-8433-4c17-81c8-7117c1513e72\",\"createdAt\":\"2021-01-11T19:39:22.480Z\",\"runtimeVersion\":\"1.0\",\"launchAsset\":{\"hash\":\"DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA\",\"key\":\"0436e5821bff7b95a84c21f22a43cb96.bundle\",\"contentType\":\"application/javascript\",\"url\":\"https://url.to/bundle\"},\"assets\":[{\"hash\":\"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo\",\"key\":\"3261e570d51777be1e99116562280926.png\",\"contentType\":\"image/png\",\"url\":\"https://url.to/asset\"}],\"metadata\":{\"branchName\":\"default\"}}")).let {
    ExpoUpdatesUpdate.fromExpoUpdatesManifest(it, null, config).updateEntity
  }
  private val updateRollout1 = ExpoUpdatesManifest(JSONObject("{\"id\":\"079cde35-8433-4c17-81c8-7117c1513e73\",\"createdAt\":\"2021-01-12T19:39:22.480Z\",\"runtimeVersion\":\"1.0\",\"launchAsset\":{\"hash\":\"DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA\",\"key\":\"0436e5821bff7b95a84c21f22a43cb96.bundle\",\"contentType\":\"application/javascript\",\"url\":\"https://url.to/bundle\"},\"assets\":[{\"hash\":\"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo\",\"key\":\"3261e570d51777be1e99116562280926.png\",\"contentType\":\"image/png\",\"url\":\"https://url.to/asset\"}],\"metadata\":{\"branchName\":\"rollout\"}}")).let {
    ExpoUpdatesUpdate.fromExpoUpdatesManifest(it, null, config).updateEntity
  }
  private val updateDefault2 = ExpoUpdatesManifest(JSONObject("{\"id\":\"079cde35-8433-4c17-81c8-7117c1513e74\",\"createdAt\":\"2021-01-13T19:39:22.480Z\",\"runtimeVersion\":\"1.0\",\"launchAsset\":{\"hash\":\"DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA\",\"key\":\"0436e5821bff7b95a84c21f22a43cb96.bundle\",\"contentType\":\"application/javascript\",\"url\":\"https://url.to/bundle\"},\"assets\":[{\"hash\":\"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo\",\"key\":\"3261e570d51777be1e99116562280926.png\",\"contentType\":\"image/png\",\"url\":\"https://url.to/asset\"}],\"metadata\":{\"branchName\":\"default\"}}")).let {
    ExpoUpdatesUpdate.fromExpoUpdatesManifest(it, null, config).updateEntity
  }
  private val updateRollout2 = ExpoUpdatesManifest(JSONObject("{\"id\":\"079cde35-8433-4c17-81c8-7117c1513e75\",\"createdAt\":\"2021-01-14T19:39:22.480Z\",\"runtimeVersion\":\"1.0\",\"launchAsset\":{\"hash\":\"DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA\",\"key\":\"0436e5821bff7b95a84c21f22a43cb96.bundle\",\"contentType\":\"application/javascript\",\"url\":\"https://url.to/bundle\"},\"assets\":[{\"hash\":\"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo\",\"key\":\"3261e570d51777be1e99116562280926.png\",\"contentType\":\"image/png\",\"url\":\"https://url.to/asset\"}],\"metadata\":{\"branchName\":\"rollout\"}}")).let {
    ExpoUpdatesUpdate.fromExpoUpdatesManifest(it, null, config).updateEntity
  }
  private val updateMultipleFilters = ExpoUpdatesManifest(JSONObject("{\"id\":\"079cde35-8433-4c17-81c8-7117c1513e72\",\"createdAt\":\"2021-01-11T19:39:22.480Z\",\"runtimeVersion\":\"1.0\",\"launchAsset\":{\"hash\":\"DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA\",\"key\":\"0436e5821bff7b95a84c21f22a43cb96.bundle\",\"contentType\":\"application/javascript\",\"url\":\"https://url.to/bundle\"},\"assets\":[{\"hash\":\"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo\",\"key\":\"3261e570d51777be1e99116562280926.png\",\"contentType\":\"image/png\",\"url\":\"https://url.to/asset\"}],\"metadata\":{\"firstKey\": \"value1\", \"secondKey\": \"value2\"}}")).let {
    ExpoUpdatesUpdate.fromExpoUpdatesManifest(it, null, config).updateEntity
  }
  private val updateNoMetadata = ExpoUpdatesManifest(JSONObject("{\"id\":\"079cde35-8433-4c17-81c8-7117c1513e72\",\"createdAt\":\"2021-01-11T19:39:22.480Z\",\"runtimeVersion\":\"1.0\",\"launchAsset\":{\"hash\":\"DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA\",\"key\":\"0436e5821bff7b95a84c21f22a43cb96.bundle\",\"contentType\":\"application/javascript\",\"url\":\"https://url.to/bundle\"},\"assets\":[{\"hash\":\"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo\",\"key\":\"3261e570d51777be1e99116562280926.png\",\"contentType\":\"image/png\",\"url\":\"https://url.to/asset\"}]}")).let {
    ExpoUpdatesUpdate.fromExpoUpdatesManifest(it, null, config).updateEntity
  }

  @Test
  fun testSelectUpdateToLaunch() {
    // should pick the newest update that matches the manifest filters
    val expected = updateRollout1
    val actual = selectionPolicy.selectUpdateToLaunch(listOf(updateDefault1, expected, updateDefault2), manifestFilters)
    Assert.assertEquals(expected, actual)
  }

  @Test
  fun testSelectUpdatesToDelete_SecondNewestMatching() {
    // if there is an older update that matches the manifest filters, keep that one over any newer ones that don't match
    val updatesToDelete = selectionPolicy.selectUpdatesToDelete(listOf(updateRollout0, updateDefault1, updateRollout1, updateDefault2, updateRollout2), updateRollout2, manifestFilters)
    Assert.assertEquals(3, updatesToDelete.size.toLong())
    Assert.assertTrue(updatesToDelete.contains(updateRollout0))
    Assert.assertTrue(updatesToDelete.contains(updateDefault1))
    Assert.assertFalse(updatesToDelete.contains(updateRollout1))
    Assert.assertTrue(updatesToDelete.contains(updateDefault2))
    Assert.assertFalse(updatesToDelete.contains(updateRollout2))
  }

  @Test
  fun testSelectUpdatesToDelete_NoneOlderMatching() {
    // if there is no older update that matches the manifest filters, just keep the next newest one
    val updatesToDelete = selectionPolicy.selectUpdatesToDelete(listOf(updateDefault1, updateDefault2, updateRollout2), updateRollout2, manifestFilters)
    Assert.assertEquals(1, updatesToDelete.size.toLong())
    Assert.assertTrue(updatesToDelete.contains(updateDefault1))
    Assert.assertFalse(updatesToDelete.contains(updateDefault2))
    Assert.assertFalse(updatesToDelete.contains(updateRollout2))
  }

  @Test
  fun testShouldLoadNewUpdate_NormalCase_NewUpdate() {
    val actual = selectionPolicy.shouldLoadNewUpdate(updateRollout2, updateRollout1, manifestFilters)
    Assert.assertTrue(actual)
  }

  @Test
  fun testShouldLoadNewUpdate_NormalCase_NoUpdate() {
    val actual = selectionPolicy.shouldLoadNewUpdate(updateRollout1, updateRollout1, manifestFilters)
    Assert.assertFalse(actual)
  }

  @Test
  fun testShouldLoadNewUpdate_NormalCase_OlderUpdate() {
    // this could happen if the embedded update is newer than the most recently published update
    val actual = selectionPolicy.shouldLoadNewUpdate(updateRollout1, updateRollout2, manifestFilters)
    Assert.assertFalse(actual)
  }

  @Test
  fun testShouldLoadNewUpdate_NoneMatchingFilters() {
    // should choose to load an older update if the current update doesn't match the manifest filters
    val actual = selectionPolicy.shouldLoadNewUpdate(updateRollout1, updateDefault2, manifestFilters)
    Assert.assertTrue(actual)
  }

  @Test
  fun testShouldLoadNewUpdate_NewerExists() {
    val actual = selectionPolicy.shouldLoadNewUpdate(updateRollout1, updateRollout2, manifestFilters)
    Assert.assertFalse(actual)
  }

  @Test
  fun testShouldLoadNewUpdate_DoesntMatch() {
    // should never choose to load an update that doesn't match its own filters
    val actual = selectionPolicy.shouldLoadNewUpdate(updateDefault2, null, manifestFilters)
    Assert.assertFalse(actual)
  }

  @Test
  fun testShouldLoadRollBackToEmbeddedDirective_EmbeddedDoesNotMatchFilters() {
    val actual = selectionPolicy.shouldLoadRollBackToEmbeddedDirective(
      UpdateDirective.RollBackToEmbeddedUpdateDirective(Date(), null),
      updateDefault1,
      null,
      manifestFilters
    )
    Assert.assertFalse(actual)
  }

  @Test
  fun testShouldLoadRollBackToEmbeddedDirective_NoLaunchedUpdate() {
    val actual = selectionPolicy.shouldLoadRollBackToEmbeddedDirective(
      UpdateDirective.RollBackToEmbeddedUpdateDirective(Date(), null),
      updateRollout0,
      null,
      manifestFilters
    )
    Assert.assertTrue(actual)
  }

  @Test
  fun testShouldLoadRollBackToEmbeddedDirective_LaunchedUpdateDoesNotMatchFilters() {
    val actual = selectionPolicy.shouldLoadRollBackToEmbeddedDirective(
      UpdateDirective.RollBackToEmbeddedUpdateDirective(Date(), null),
      updateRollout0,
      updateDefault1,
      manifestFilters
    )
    Assert.assertTrue(actual)
  }

  @Test
  fun testShouldLoadRollBackToEmbeddedDirective_CommitTimeOfLaunchedUpdateBeforeRollBack() {
    // updateRollout1 has commitTime = 2021-01-12T19:39:22.480Z
    // roll back is 1 year later
    val actual = selectionPolicy.shouldLoadRollBackToEmbeddedDirective(
      UpdateDirective.RollBackToEmbeddedUpdateDirective(UpdatesUtils.parseDateString("2022-01-12T19:39:22.480Z"), null),
      updateRollout0,
      updateRollout1,
      manifestFilters
    )
    Assert.assertTrue(actual)
  }

  @Test
  fun testShouldLoadRollBackToEmbeddedDirective_CommitTimeOfLaunchedUpdateAfterRollBack() {
    // updateRollout1 has commitTime = 2021-01-12T19:39:22.480Z
    // roll back is 1 year earlier
    val actual = selectionPolicy.shouldLoadRollBackToEmbeddedDirective(
      UpdateDirective.RollBackToEmbeddedUpdateDirective(UpdatesUtils.parseDateString("2020-01-12T19:39:22.480Z"), null),
      updateRollout0,
      updateRollout1,
      manifestFilters
    )
    Assert.assertFalse(actual)
  }

  @Test
  @Throws(JSONException::class)
  fun testMatchesFilters_MultipleFilters() {
    // if there are multiple filters, a manifest must match them all to pass
    Assert.assertFalse(SelectionPolicies.matchesFilters(updateMultipleFilters, JSONObject("{\"firstkey\": \"value1\", \"secondkey\": \"wrong-value\"}")))
    Assert.assertTrue(SelectionPolicies.matchesFilters(updateMultipleFilters, JSONObject("{\"firstkey\": \"value1\", \"secondkey\": \"value2\"}")))
  }

  @Test
  @Throws(JSONException::class)
  fun testMatchesFilters_EmptyMatchesAll() {
    // no field is counted as a match
    Assert.assertTrue(SelectionPolicies.matchesFilters(updateDefault1, JSONObject("{\"field-that-update-doesnt-have\": \"value\"}")))
  }

  @Test
  @Throws(JSONException::class)
  fun testMatchesFilters_Null() {
    // null filters or null metadata (i.e. bare or legacy manifests) is counted as a match
    Assert.assertTrue(SelectionPolicies.matchesFilters(updateDefault1, null))
    Assert.assertTrue(SelectionPolicies.matchesFilters(updateNoMetadata, manifestFilters))
  }
}
