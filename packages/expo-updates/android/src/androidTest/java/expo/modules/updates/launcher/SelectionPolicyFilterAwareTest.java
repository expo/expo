package expo.modules.updates.launcher;

import android.net.Uri;

import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import androidx.test.internal.runner.junit4.AndroidJUnit4ClassRunner;
import expo.modules.updates.UpdatesConfiguration;
import expo.modules.updates.db.entity.UpdateEntity;
import expo.modules.updates.manifest.NewManifest;

@RunWith(AndroidJUnit4ClassRunner.class)
public class SelectionPolicyFilterAwareTest {
  JSONObject manifestFilters;
  SelectionPolicyFilterAware selectionPolicy;

  UpdateEntity updateDefault1;
  UpdateEntity updateDefault2;
  UpdateEntity updateRollout1;
  UpdateEntity updateRollout2;
  UpdateEntity updateMultipleFilters;

  @Before
  public void setup() throws JSONException {
    manifestFilters = new JSONObject("{\"releaseName\": \"rollout\"}");
    selectionPolicy = new SelectionPolicyFilterAware("1.0");

    HashMap<String, Object> configMap = new HashMap<>();
    configMap.put("updateUrl", Uri.parse("https://exp.host/@test/test"));
    UpdatesConfiguration config = new UpdatesConfiguration().loadValuesFromMap(configMap);

    JSONObject manifestJsonDefault1 = new JSONObject("{\"id\":\"079cde35-8433-4c17-81c8-7117c1513e72\",\"createdAt\":\"2021-01-11T19:39:22.480Z\",\"runtimeVersion\":\"1.0\",\"launchAsset\":{\"hash\":\"DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA\",\"key\":\"0436e5821bff7b95a84c21f22a43cb96.bundle\",\"contentType\":\"application/javascript\",\"url\":\"https://url.to/bundle\"},\"assets\":[{\"hash\":\"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo\",\"key\":\"3261e570d51777be1e99116562280926.png\",\"contentType\":\"image/png\",\"url\":\"https://url.to/asset\"}],\"updateMetadata\":{\"releaseName\":\"default\"}}");
    updateDefault1 = NewManifest.fromManifestJson(manifestJsonDefault1, config).getUpdateEntity();

    JSONObject manifestJsonRollout1 = new JSONObject("{\"id\":\"079cde35-8433-4c17-81c8-7117c1513e73\",\"createdAt\":\"2021-01-12T19:39:22.480Z\",\"runtimeVersion\":\"1.0\",\"launchAsset\":{\"hash\":\"DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA\",\"key\":\"0436e5821bff7b95a84c21f22a43cb96.bundle\",\"contentType\":\"application/javascript\",\"url\":\"https://url.to/bundle\"},\"assets\":[{\"hash\":\"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo\",\"key\":\"3261e570d51777be1e99116562280926.png\",\"contentType\":\"image/png\",\"url\":\"https://url.to/asset\"}],\"updateMetadata\":{\"releaseName\":\"rollout\"}}");
    updateRollout1 = NewManifest.fromManifestJson(manifestJsonRollout1, config).getUpdateEntity();

    JSONObject manifestJsonDefault2 = new JSONObject("{\"id\":\"079cde35-8433-4c17-81c8-7117c1513e74\",\"createdAt\":\"2021-01-13T19:39:22.480Z\",\"runtimeVersion\":\"1.0\",\"launchAsset\":{\"hash\":\"DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA\",\"key\":\"0436e5821bff7b95a84c21f22a43cb96.bundle\",\"contentType\":\"application/javascript\",\"url\":\"https://url.to/bundle\"},\"assets\":[{\"hash\":\"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo\",\"key\":\"3261e570d51777be1e99116562280926.png\",\"contentType\":\"image/png\",\"url\":\"https://url.to/asset\"}],\"updateMetadata\":{\"releaseName\":\"default\"}}");
    updateDefault2 = NewManifest.fromManifestJson(manifestJsonDefault2, config).getUpdateEntity();

    JSONObject manifestJsonRollout2 = new JSONObject("{\"id\":\"079cde35-8433-4c17-81c8-7117c1513e75\",\"createdAt\":\"2021-01-14T19:39:22.480Z\",\"runtimeVersion\":\"1.0\",\"launchAsset\":{\"hash\":\"DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA\",\"key\":\"0436e5821bff7b95a84c21f22a43cb96.bundle\",\"contentType\":\"application/javascript\",\"url\":\"https://url.to/bundle\"},\"assets\":[{\"hash\":\"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo\",\"key\":\"3261e570d51777be1e99116562280926.png\",\"contentType\":\"image/png\",\"url\":\"https://url.to/asset\"}],\"updateMetadata\":{\"releaseName\":\"rollout\"}}");
    updateRollout2 = NewManifest.fromManifestJson(manifestJsonRollout2, config).getUpdateEntity();

    JSONObject manifestJsonMultipleFilters = new JSONObject("{\"id\":\"079cde35-8433-4c17-81c8-7117c1513e72\",\"createdAt\":\"2021-01-11T19:39:22.480Z\",\"runtimeVersion\":\"1.0\",\"launchAsset\":{\"hash\":\"DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA\",\"key\":\"0436e5821bff7b95a84c21f22a43cb96.bundle\",\"contentType\":\"application/javascript\",\"url\":\"https://url.to/bundle\"},\"assets\":[{\"hash\":\"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo\",\"key\":\"3261e570d51777be1e99116562280926.png\",\"contentType\":\"image/png\",\"url\":\"https://url.to/asset\"}],\"updateMetadata\":{\"key1\": \"value1\", \"key2\": \"value2\"}}");
    updateMultipleFilters = NewManifest.fromManifestJson(manifestJsonMultipleFilters, config).getUpdateEntity();
  }

  @Test
  public void testSelectUpdateToLaunch() {
    // should pick the newest update that matches the manifest filters
    UpdateEntity expected = updateRollout1;
    UpdateEntity actual = selectionPolicy.selectUpdateToLaunch(Arrays.asList(updateDefault1, expected, updateDefault2), manifestFilters);
    Assert.assertEquals(expected, actual);
  }

  @Test
  public void testSelectUpdatesToDelete_OlderMatching() {
    // if there is an older update that matches the manifest filters, keep that one over any newer ones that don't match
    List<UpdateEntity> updatesToDelete = selectionPolicy.selectUpdatesToDelete(Arrays.asList(updateDefault1, updateRollout1, updateDefault2, updateRollout2), updateRollout2, manifestFilters);

    Assert.assertEquals(2, updatesToDelete.size());
    Assert.assertTrue(updatesToDelete.contains(updateDefault1));
    Assert.assertFalse(updatesToDelete.contains(updateRollout1));
    Assert.assertTrue(updatesToDelete.contains(updateDefault2));
    Assert.assertFalse(updatesToDelete.contains(updateRollout2));
  }

  @Test
  public void testSelectUpdatesToDelete_NoneOlderMatching() {
    // if there is no older update that matches the manifest filters, just keep the next newest one
    List<UpdateEntity> updatesToDelete = selectionPolicy.selectUpdatesToDelete(Arrays.asList(updateDefault1, updateDefault2, updateRollout2), updateRollout2, manifestFilters);

    Assert.assertEquals(1, updatesToDelete.size());
    Assert.assertTrue(updatesToDelete.contains(updateDefault1));
    Assert.assertFalse(updatesToDelete.contains(updateDefault2));
    Assert.assertFalse(updatesToDelete.contains(updateRollout2));
  }

  @Test
  public void testShouldLoadNewUpdate_NormalCase_NewUpdate() {
    boolean actual = selectionPolicy.shouldLoadNewUpdate(updateRollout2, updateRollout1, manifestFilters);
    Assert.assertTrue(actual);
  }

  @Test
  public void testShouldLoadNewUpdate_NormalCase_NoUpdate() {
    boolean actual = selectionPolicy.shouldLoadNewUpdate(updateRollout1, updateRollout1, manifestFilters);
    Assert.assertFalse(actual);
  }

  @Test
  public void testShouldLoadNewUpdate_NoneMatchingFilters() {
    // should choose to load an older update if the current update doesn't match the manifest filters
    boolean actual = selectionPolicy.shouldLoadNewUpdate(updateRollout1, updateDefault2, manifestFilters);
    Assert.assertTrue(actual);
  }

  @Test
  public void testShouldLoadNewUpdate_NewerExists() {
    boolean actual = selectionPolicy.shouldLoadNewUpdate(updateRollout1, updateRollout2, manifestFilters);
    Assert.assertFalse(actual);
  }

  @Test
  public void testShouldLoadNewUpdate_OlderExistsMatchingFilters() {
    // should not choose to load a new update that doesn't match the manifest filters
    // if there is an existing older update that matches the filters
    boolean actual = selectionPolicy.shouldLoadNewUpdate(updateDefault2, updateRollout1, manifestFilters);
    Assert.assertFalse(actual);
  }

  @Test
  public void testShouldLoadNewUpdate_NoneExistsMatchingCurrentFilters() {
    // should choose to load a new update that doesn't match the manifest filters
    // if no existing updates match the manifest filters
    boolean actual = selectionPolicy.shouldLoadNewUpdate(updateDefault2, null, manifestFilters);
    Assert.assertTrue(actual);
  }

  @Test
  public void testShouldLoadNewUpdate_NoneExistsMatchingNewFilters() {
    // should choose to load a new update that doesn't match the manifest filters
    // if no existing updates match the manifest filters
    boolean actual = selectionPolicy.shouldLoadNewUpdate(updateDefault2, updateDefault1, manifestFilters);
    Assert.assertTrue(actual);
  }

  @Test
  public void testMatchesFilters_MultipleFilters() throws JSONException {
    // if there are multiple filters, a manifest must match them all to pass
    Assert.assertFalse(selectionPolicy.matchesFilters(updateMultipleFilters, new JSONObject("{\"key1\": \"value1\", \"key2\": \"wrong-value\"}")));
    Assert.assertTrue(selectionPolicy.matchesFilters(updateMultipleFilters, new JSONObject("{\"key1\": \"value1\", \"key2\": \"value2\"}")));
  }

  @Test
  public void testMatchesFilters_EmptyMatchesAll() throws JSONException {
    // no field is counted as a match
    Assert.assertTrue(selectionPolicy.matchesFilters(updateDefault1, new JSONObject("{\"fieldThatUpdateDoesntHave\": \"value\"}")));
  }
}
