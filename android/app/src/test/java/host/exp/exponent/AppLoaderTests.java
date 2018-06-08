package host.exp.exponent;

import android.app.Application;
import android.content.Context;

import org.json.JSONObject;
import org.junit.Assert;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Matchers;
import org.mockito.Mock;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.junit.MockitoJUnit;
import org.mockito.junit.MockitoRule;
import org.mockito.stubbing.Answer;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

import java.util.ArrayList;
import java.util.List;

import host.exp.exponent.kernel.Crypto;
import host.exp.exponent.network.ExponentHttpClient;
import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponent.utils.MockExpoDI;
import host.exp.exponent.utils.MockExpoHttpClient;
import host.exp.exponent.utils.MockManifest;
import host.exp.expoview.Exponent;

import static org.mockito.Mockito.*;

@RunWith(RobolectricTestRunner.class)
@Config(manifest = Config.NONE)
public class AppLoaderTests {

  @Rule
  public MockitoRule rule = MockitoJUnit.rule();

  @Mock
  Context mContext;

  @Mock
  Application mApplication;

  @Mock
  ExpoHandler mExpoHandler;

  ExponentNetwork mExponentNetwork = mock(ExponentNetwork.class);

  @Mock
  Crypto mCrypto;

  ExponentSharedPreferences mExponentSharedPreferences = mock(ExponentSharedPreferences.class);//, withSettings().verboseLogging());
  ExponentManifest mExponentManifest = new ExponentManifest(null, mExponentNetwork, mCrypto, mExponentSharedPreferences);

  private void setExpoHttpClient(final ExponentHttpClient expoHttpClient) {
    doAnswer(new Answer<ExponentHttpClient>() {
      @Override
      public ExponentHttpClient answer(InvocationOnMock invocation) throws Throwable {
        return expoHttpClient;
      }
    }).when(mExponentNetwork).getClient();

    doAnswer(new Answer<ExponentHttpClient>() {
      @Override
      public ExponentHttpClient answer(InvocationOnMock invocation) throws Throwable {
        return expoHttpClient;
      }
    }).when(mExponentNetwork).getLongTimeoutClient();
  }

  private static class AppLoaderMethodCall {

    private String mMethod;
    private Object mValue;

    AppLoaderMethodCall(final String method, final Object value) {
      mMethod = method;
      mValue = value;
    }

    public static void assertEqual(AppLoaderMethodCall expected, AppLoaderMethodCall actual) {
      Assert.assertEquals(expected.mMethod, actual.mMethod);
      Assert.assertEquals(expected.mValue.toString(), actual.mValue.toString());
    }
  }

  private static class AppLoaderResults extends AppLoader {

    private List<AppLoaderMethodCall> mCalls = new ArrayList<>();

    AppLoaderResults(final String manifestUrl) {
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

  @Test
  public void defaultUpdates() {
    Constants.setInTest();
    doAnswer(new Answer<Void>() {
       @Override
       public Void answer(InvocationOnMock invocation) throws Throwable {
         Runnable runnable = invocation.getArgumentAt(0, Runnable.class);
         runnable.run();
         return null;
       }
     }).when(mExpoHandler).post(Matchers.any(Runnable.class));

    MockExpoDI.initialize();
    MockExpoDI.addMock(mContext, mApplication, mExpoHandler, mExponentNetwork, mCrypto, mExponentSharedPreferences, mExponentManifest);
    setExpoHttpClient(new MockExpoHttpClient()
        .callDefaultCache(MockExpoHttpClient.ResponseType.NORMAL, new MockManifest().toString())
        .callSafe(MockExpoHttpClient.ResponseType.NORMAL, new MockManifest().toString())
        .getHardCodedResponse(null)
        .tryForcedCachedResponse(MockExpoHttpClient.ResponseType.FAILURE, "Not in cache")
        .build());

    Exponent.initialize(mContext, mApplication);

    AppLoaderResults appLoaderResults = new AppLoaderResults("exp://exp.host/@esamelson/test-fetch-update");
    appLoaderResults.start();

    List<AppLoaderMethodCall> expectedCalls = new ArrayList<>();
    expectedCalls.add(new AppLoaderMethodCall("onOptimisticManifest", new MockManifest().isVerified(false).loadedFromCache(false).toString()));
    expectedCalls.add(new AppLoaderMethodCall("onManifestCompleted", new MockManifest().isVerified(false).loadedFromCache(false).toString()));
    expectedCalls.add(new AppLoaderMethodCall("onBundleCompleted", new Object()));
    AppLoaderResults.assertEquals(expectedCalls, appLoaderResults);
  }
}