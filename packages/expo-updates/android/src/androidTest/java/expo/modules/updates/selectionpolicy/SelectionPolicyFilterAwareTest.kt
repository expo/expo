package expo.modules.updates.selectionpolicy

import android.net.Uri
import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner
import expo.modules.manifests.core.NewManifest
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.manifest.NewUpdateManifest
import org.json.JSONException
import org.json.JSONObject
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4ClassRunner::class)
class SelectionPolicyFilterAwareTest {
  private lateinit var manifestFilters: JSONObject
  private lateinit var selectionPolicy: SelectionPolicy
  private lateinit var updateDefault1: UpdateEntity
  private lateinit var updateDefault2: UpdateEntity
  private lateinit var updateRollout0: UpdateEntity
  private lateinit var updateRollout1: UpdateEntity
  private lateinit var updateRollout2: UpdateEntity
  private lateinit var updateMultipleFilters: UpdateEntity
  private lateinit var updateNoMetadata: UpdateEntity

  @Before
  @Throws(JSONException::class)
  fun setup() {
    manifestFilters = JSONObject("{\"branchname\": \"rollout\"}")
    selectionPolicy = SelectionPolicyFactory.createFilterAwarePolicy("1.0")
    val configMap = mapOf<String, Any>("updateUrl" to Uri.parse("https://exp.host/@test/test"))
    val config = UpdatesConfiguration(null, configMap)
    val manifestJsonRollout0 = NewManifest(JSONObject("{\"id\":\"079cde35-8433-4c17-81c8-7117c1513e71\",\"createdAt\":\"2021-01-10T19:39:22.480Z\",\"runtimeVersion\":\"1.0\",\"launchAsset\":{\"hash\":\"DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA\",\"key\":\"0436e5821bff7b95a84c21f22a43cb96.bundle\",\"contentType\":\"application/javascript\",\"url\":\"https://url.to/bundle\"},\"assets\":[{\"hash\":\"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo\",\"key\":\"3261e570d51777be1e99116562280926.png\",\"contentType\":\"image/png\",\"url\":\"https://url.to/asset\"}],\"metadata\":{\"branchName\":\"rollout\"}}"))
    updateRollout0 = NewUpdateManifest.fromNewManifest(manifestJsonRollout0, null, config).updateEntity
    val manifestJsonDefault1 = NewManifest(JSONObject("{\"id\":\"079cde35-8433-4c17-81c8-7117c1513e72\",\"createdAt\":\"2021-01-11T19:39:22.480Z\",\"runtimeVersion\":\"1.0\",\"launchAsset\":{\"hash\":\"DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA\",\"key\":\"0436e5821bff7b95a84c21f22a43cb96.bundle\",\"contentType\":\"application/javascript\",\"url\":\"https://url.to/bundle\"},\"assets\":[{\"hash\":\"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo\",\"key\":\"3261e570d51777be1e99116562280926.png\",\"contentType\":\"image/png\",\"url\":\"https://url.to/asset\"}],\"metadata\":{\"branchName\":\"default\"}}"))
    updateDefault1 = NewUpdateManifest.fromNewManifest(manifestJsonDefault1, null, config).updateEntity
    val manifestJsonRollout1 = NewManifest(JSONObject("{\"id\":\"079cde35-8433-4c17-81c8-7117c1513e73\",\"createdAt\":\"2021-01-12T19:39:22.480Z\",\"runtimeVersion\":\"1.0\",\"launchAsset\":{\"hash\":\"DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA\",\"key\":\"0436e5821bff7b95a84c21f22a43cb96.bundle\",\"contentType\":\"application/javascript\",\"url\":\"https://url.to/bundle\"},\"assets\":[{\"hash\":\"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo\",\"key\":\"3261e570d51777be1e99116562280926.png\",\"contentType\":\"image/png\",\"url\":\"https://url.to/asset\"}],\"metadata\":{\"branchName\":\"rollout\"}}"))
    updateRollout1 = NewUpdateManifest.fromNewManifest(manifestJsonRollout1, null, config).updateEntity
    val manifestJsonDefault2 = NewManifest(JSONObject("{\"id\":\"079cde35-8433-4c17-81c8-7117c1513e74\",\"createdAt\":\"2021-01-13T19:39:22.480Z\",\"runtimeVersion\":\"1.0\",\"launchAsset\":{\"hash\":\"DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA\",\"key\":\"0436e5821bff7b95a84c21f22a43cb96.bundle\",\"contentType\":\"application/javascript\",\"url\":\"https://url.to/bundle\"},\"assets\":[{\"hash\":\"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo\",\"key\":\"3261e570d51777be1e99116562280926.png\",\"contentType\":\"image/png\",\"url\":\"https://url.to/asset\"}],\"metadata\":{\"branchName\":\"default\"}}"))
    updateDefault2 = NewUpdateManifest.fromNewManifest(manifestJsonDefault2, null, config).updateEntity
    val manifestJsonRollout2 = NewManifest(JSONObject("{\"id\":\"079cde35-8433-4c17-81c8-7117c1513e75\",\"createdAt\":\"2021-01-14T19:39:22.480Z\",\"runtimeVersion\":\"1.0\",\"launchAsset\":{\"hash\":\"DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA\",\"key\":\"0436e5821bff7b95a84c21f22a43cb96.bundle\",\"contentType\":\"application/javascript\",\"url\":\"https://url.to/bundle\"},\"assets\":[{\"hash\":\"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo\",\"key\":\"3261e570d51777be1e99116562280926.png\",\"contentType\":\"image/png\",\"url\":\"https://url.to/asset\"}],\"metadata\":{\"branchName\":\"rollout\"}}"))
    updateRollout2 = NewUpdateManifest.fromNewManifest(manifestJsonRollout2, null, config).updateEntity
    val manifestJsonMultipleFilters = NewManifest(JSONObject("{\"id\":\"079cde35-8433-4c17-81c8-7117c1513e72\",\"createdAt\":\"2021-01-11T19:39:22.480Z\",\"runtimeVersion\":\"1.0\",\"launchAsset\":{\"hash\":\"DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA\",\"key\":\"0436e5821bff7b95a84c21f22a43cb96.bundle\",\"contentType\":\"application/javascript\",\"url\":\"https://url.to/bundle\"},\"assets\":[{\"hash\":\"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo\",\"key\":\"3261e570d51777be1e99116562280926.png\",\"contentType\":\"image/png\",\"url\":\"https://url.to/asset\"}],\"metadata\":{\"firstKey\": \"value1\", \"secondKey\": \"value2\"}}"))
    updateMultipleFilters = NewUpdateManifest.fromNewManifest(manifestJsonMultipleFilters, null, config).updateEntity
    val manifestJsonNoMetadata = NewManifest(JSONObject("{\"id\":\"079cde35-8433-4c17-81c8-7117c1513e72\",\"createdAt\":\"2021-01-11T19:39:22.480Z\",\"runtimeVersion\":\"1.0\",\"launchAsset\":{\"hash\":\"DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA\",\"key\":\"0436e5821bff7b95a84c21f22a43cb96.bundle\",\"contentType\":\"application/javascript\",\"url\":\"https://url.to/bundle\"},\"assets\":[{\"hash\":\"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo\",\"key\":\"3261e570d51777be1e99116562280926.png\",\"contentType\":\"image/png\",\"url\":\"https://url.to/asset\"}]}"))
    updateNoMetadata = NewUpdateManifest.fromNewManifest(manifestJsonNoMetadata, null, config).updateEntity
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
