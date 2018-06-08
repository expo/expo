package host.exp.exponent.utils;

import org.json.JSONObject;
import org.junit.Assert;

import java.util.ArrayList;
import java.util.List;

import host.exp.exponent.AppLoader;

public class AppLoaderResults extends AppLoader {

  private List<AppLoaderMethodCall> mCalls = new ArrayList<>();

  public AppLoaderResults(final String manifestUrl) {
    super(manifestUrl);
  }

  @Override
  public void onOptimisticManifest(JSONObject optimisticManifest) {
    mCalls.add(new AppLoaderMethodCall("onOptimisticManifest", optimisticManifest));
  }

  @Override
  public void onManifestCompleted(JSONObject manifest) {
    mCalls.add(new AppLoaderMethodCall("onManifestCompleted", manifest));
  }

  @Override
  public void onBundleCompleted(String localBundlePath) {
    mCalls.add(new AppLoaderMethodCall("onBundleCompleted", localBundlePath));
  }

  @Override
  public void emitEvent(JSONObject params) {
    mCalls.add(new AppLoaderMethodCall("emitEvent", params));
  }

  @Override
  public void onError(Exception e) {
    mCalls.add(new AppLoaderMethodCall("onError", e));
  }

  @Override
  public void onError(String e) {
    mCalls.add(new AppLoaderMethodCall("onError", e));
  }

  public static void assertEquals(List<AppLoaderMethodCall> expected, AppLoaderResults actual) {
    Assert.assertEquals(expected.size(), actual.mCalls.size());

    for (int i = 0; i < expected.size(); i++) {
      AppLoaderMethodCall.assertEqual(expected.get(i), actual.mCalls.get(i));
    }
  }
}