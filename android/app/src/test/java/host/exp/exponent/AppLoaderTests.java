package host.exp.exponent;

import android.app.Application;
import android.content.Context;

import org.json.JSONObject;
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

import java.io.IOException;

import expolib_v1.okhttp3.Callback;
import expolib_v1.okhttp3.Request;
import expolib_v1.okhttp3.Response;
import host.exp.exponent.kernel.Crypto;
import host.exp.exponent.network.ExpoHttpCallback;
import host.exp.exponent.network.ExponentHttpClient;
import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.network.ManualExpoResponse;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponent.utils.MockExpoDI;
import host.exp.exponent.utils.MockExpoHttpClient;
import host.exp.exponent.utils.MockManifest;
import host.exp.expoview.Exponent;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.*;

@RunWith(RobolectricTestRunner.class)
@Config(constants = BuildConfig.class, manifest = Config.NONE)
public class AppLoaderTests {

  @Rule
  public MockitoRule rule = MockitoJUnit.rule();

  @Mock
  Context mContext;

  @Mock
  Application mApplication;

  @Mock
  ExpoHandler mExpoHandler;

  ExponentNetwork mExponentNetwork = mock(ExponentNetwork.class);//, withSettings().verboseLogging());

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

  @Test
  public void defaultUpdates() {
    MockExpoDI.initialize();
    MockExpoDI.addMock(mContext, mApplication, mExpoHandler, mExponentNetwork, mCrypto, mExponentSharedPreferences, mExponentManifest);
    setExpoHttpClient(new MockExpoHttpClient()
        .callDefaultCache(new MockManifest())
        .callSafe(new MockManifest())
        .getHardCodedResponse(new MockManifest())
        .tryForcedCachedResponse(new MockManifest())
        .build());

    Exponent.initialize(mContext, mApplication);

    new AppLoader("exp://exp.host/@esamelson/test-fetch-update") {

      @Override
      public void onOptimisticManifest(JSONObject optimisticManifest) {
        System.out.print("onOptimisticManifest");
      }

      @Override
      public void onManifestCompleted(JSONObject manifest) {
        System.out.print("onManifestCompleted");
      }

      @Override
      public void onBundleCompleted(String localBundlePath) {
        System.out.print("onBundleCompleted");
      }

      @Override
      public void emitEvent(JSONObject params) {
        System.out.print("emitEvent");
      }

      @Override
      public void onError(Exception e) {
        System.out.print("onError");
      }

      @Override
      public void onError(String e) {
        System.out.print("onError");
      }
    }.start();
  }


}