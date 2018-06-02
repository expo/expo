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

import expolib_v1.okhttp3.Request;
import expolib_v1.okhttp3.Response;
import host.exp.exponent.kernel.Crypto;
import host.exp.exponent.network.ExponentHttpClient;
import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponent.utils.MockExpoDI;

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

  ExponentNetwork mExponentNetwork = mock(ExponentNetwork.class, withSettings().verboseLogging());

  @Mock
  Crypto mCrypto;

  ExponentSharedPreferences mExponentSharedPreferences = mock(ExponentSharedPreferences.class, withSettings().verboseLogging());
  ExponentManifest mExponentManifest = new ExponentManifest(null, mExponentNetwork, mCrypto, mExponentSharedPreferences);

  private ExponentHttpClient getMockedExponentHttpClient() {
    ExponentHttpClient exponentHttpClient = mock(ExponentHttpClient.class, withSettings().verboseLogging());

    doAnswer(new Answer<Void>() {
      @Override
      public Void answer(InvocationOnMock invocation) throws Throwable {
        ExponentHttpClient.SafeCallback safeCallback = invocation.getArgumentAt(2, ExponentHttpClient.SafeCallback.class);

        safeCallback.onCachedResponse();

        return null;
      }
    }).when(exponentHttpClient).tryForcedCachedResponse(Matchers.anyString(), Matchers.any(Request.class), Matchers.any(ExponentHttpClient.SafeCallback.class), Matchers.any(Response.class), Matchers.any(IOException.class));

    return exponentHttpClient;
  }

  @Test
  public void defaultUpdates() {
    doAnswer(new Answer<ExponentHttpClient>() {
      @Override
      public ExponentHttpClient answer(InvocationOnMock invocation) throws Throwable {
        return getMockedExponentHttpClient();
      }
    }).when(mExponentNetwork).getClient();


    MockExpoDI.initialize();
    MockExpoDI.addMock(mContext, mApplication, mExpoHandler, mExponentNetwork, mCrypto, mExponentSharedPreferences, mExponentManifest);

    new AppLoader("exp://exp.host/@esamelson/test-fetch-update") {

      @Override
      public void onOptimisticManifest(JSONObject optimisticManifest) {

      }

      @Override
      public void onManifestCompleted(JSONObject manifest) {

      }

      @Override
      public void onBundleCompleted(String localBundlePath) {

      }

      @Override
      public void emitEvent(JSONObject params) {

      }

      @Override
      public void onError(Exception e) {

      }

      @Override
      public void onError(String e) {

      }
    }.start();
  }


}