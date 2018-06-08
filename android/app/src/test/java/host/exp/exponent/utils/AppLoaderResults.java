package host.exp.exponent.utils;

import org.json.JSONObject;
import org.junit.Assert;

import java.util.ArrayList;
import java.util.List;

import host.exp.exponent.AppLoader;

/*
 * Records which callbacks have been triggered from an AppLoader instance
 */
public class AppLoaderResults extends AppLoader {

  private List<AppLoaderCallbackRecord> mCalls = new ArrayList<>();

  public AppLoaderResults(final String manifestUrl) {
    super(manifestUrl);
  }

  @Override
  public void onOptimisticManifest(JSONObject optimisticManifest) {
    mCalls.add(new AppLoaderCallbackRecord("onOptimisticManifest", optimisticManifest));
  }

  @Override
  public void onManifestCompleted(JSONObject manifest) {
    mCalls.add(new AppLoaderCallbackRecord("onManifestCompleted", manifest));
  }

  @Override
  public void onBundleCompleted(String localBundlePath) {
    mCalls.add(new AppLoaderCallbackRecord("onBundleCompleted", localBundlePath));
  }

  @Override
  public void emitEvent(JSONObject params) {
    mCalls.add(new AppLoaderCallbackRecord("emitEvent", params));
  }

  @Override
  public void onError(Exception e) {
    mCalls.add(new AppLoaderCallbackRecord("onError", e));
  }

  @Override
  public void onError(String e) {
    mCalls.add(new AppLoaderCallbackRecord("onError", e));
  }

  public static void assertEquals(List<AppLoaderCallbackRecord> expected, AppLoaderResults actual) {
    Assert.assertEquals(expected.size(), actual.mCalls.size());

    for (int i = 0; i < expected.size(); i++) {
      AppLoaderCallbackRecord.assertEqual(expected.get(i), actual.mCalls.get(i));
    }
  }
}
