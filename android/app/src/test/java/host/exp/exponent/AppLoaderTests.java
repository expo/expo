package host.exp.exponent;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import host.exp.exponent.utils.AppLoaderCallbackRecord;
import host.exp.exponent.utils.AppLoaderResults;
import host.exp.exponent.utils.ExpoUnitTestBase;
import host.exp.exponent.utils.MockExpoHttpClient;
import host.exp.exponent.utils.MockManifest;

@RunWith(RobolectricTestRunner.class)
@Config(manifest = Config.NONE)
public class AppLoaderTests extends ExpoUnitTestBase {

  @Before
  public void before() {
    baseBefore();
  }

  @Test
  public void defaultUpdates() {
    new MockExpoHttpClient()
        .callDefaultCache(MockExpoHttpClient.ResponseType.NORMAL, new MockManifest().toString())
        .callSafe(MockExpoHttpClient.ResponseType.NORMAL, new MockManifest().toString())
        .getHardCodedResponse(null)
        .tryForcedCachedResponse(MockExpoHttpClient.ResponseType.FAILURE, "Not in cache")
        .use(mExponentNetwork);

    AppLoaderResults appLoaderResults = new AppLoaderResults("exp://exp.host/@esamelson/test-fetch-update");
    appLoaderResults.start();

    List<AppLoaderCallbackRecord> expectedCalls = new ArrayList<>();
    expectedCalls.add(new AppLoaderCallbackRecord("onOptimisticManifest", new MockManifest().isVerified(false).loadedFromCache(false).toString()));
    expectedCalls.add(new AppLoaderCallbackRecord("onManifestCompleted", new MockManifest().isVerified(false).loadedFromCache(false).toString()));
    expectedCalls.add(new AppLoaderCallbackRecord("onBundleCompleted", new File("mockFsDirectory/27.0.0/cached-bundle-experience-%40esamelson%2Ftest-fetch-update478682697-27.0.0").getAbsolutePath()));
    AppLoaderResults.assertEquals(expectedCalls, appLoaderResults);
  }
}
