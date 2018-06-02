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
import host.exp.exponent.network.ExponentHttpClient;
import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.network.ManualExpoResponse;
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

  ExponentNetwork mExponentNetwork = mock(ExponentNetwork.class);//, withSettings().verboseLogging());

  @Mock
  Crypto mCrypto;

  ExponentSharedPreferences mExponentSharedPreferences = mock(ExponentSharedPreferences.class);//, withSettings().verboseLogging());
  ExponentManifest mExponentManifest = new ExponentManifest(null, mExponentNetwork, mCrypto, mExponentSharedPreferences);

  private ExponentHttpClient getMockedExponentHttpClient() {
    ExponentHttpClient exponentHttpClient = mock(ExponentHttpClient.class);//, withSettings().verboseLogging());



    doAnswer(new Answer<Void>() {
      @Override
      public Void answer(InvocationOnMock invocation) throws Throwable {
        throw new RuntimeException("ExponentHttpClient.call called");
      }
    }).when(exponentHttpClient).call(Matchers.any(Request.class), Matchers.any(Callback.class));


    doAnswer(new Answer<Void>() {
      @Override
      public Void answer(InvocationOnMock invocation) throws Throwable {
        ExponentHttpClient.SafeCallback safeCallback = invocation.getArgumentAt(2, ExponentHttpClient.SafeCallback.class);

        ManualExpoResponse response = new ManualExpoResponse();
        response.setBody("{\"android\":{\"package\":\"host.exp.testfetchupdate\",\"publishBundlePath\":\"android/app/src/main/assets/shell-app.bundle\",\"publishManifestPath\":\"android/app/src/main/assets/shell-app-manifest.json\"},\"description\":\"This project is really great.\",\"detach\":{\"androidExpoViewUrl\":\"https://s3.amazonaws.com/exp-exponent-view-code/android-v2.5.3-sdk27.0.0-408c8d77-8d1f-4784-b7b4-93826250663a.tar.gz\",\"iosExpoViewUrl\":\"https://s3.amazonaws.com/exp-exponent-view-code/ios-v2.5.10-sdk27.0.0-7e6dd135-e649-48e2-ab7c-e76521ce6259.tar.gz\"},\"icon\":\"./assets/icon.png\",\"iconUrl\":\"https://d1wp6m56sqw74a.cloudfront.net/~assets/fa6577fecc0a7838f15a254577639984\",\"ios\":{\"bundleIdentifier\":\"host.exp.testfetchupdate\",\"publishBundlePath\":\"ios/test-fetch-update/Supporting/shell-app.bundle\",\"publishManifestPath\":\"ios/test-fetch-update/Supporting/shell-app-manifest.json\",\"supportsTablet\":true},\"isDetached\":true,\"locales\":{},\"name\":\"test-fetch-update\",\"orientation\":\"portrait\",\"platforms\":[\"ios\",\"android\"],\"privacy\":\"unlisted\",\"scheme\":\"expd9c42d5111d849f4b99796c00769433d\",\"sdkVersion\":\"27.0.0\",\"slug\":\"test-fetch-update\",\"splash\":{\"backgroundColor\":\"#ffffff\",\"image\":\"./assets/splash.png\",\"imageUrl\":\"https://d1wp6m56sqw74a.cloudfront.net/~assets/43ec0dcbe5a156bf9e650bb8c15e7af6\",\"resizeMode\":\"contain\"},\"updates\":{\"checkAutomatically\":\"ON_ERROR_RECOVERY\",\"fallbackToCacheTimeout\":0},\"version\":\"1.0.0\",\"id\":\"@esamelson/test-fetch-update\",\"revisionId\":\"1.0.0-r.OMmv5zPpWL\",\"publishedTime\":\"2018-05-30T21:43:20.000Z\",\"bundleUrl\":\"https://d1wp6m56sqw74a.cloudfront.net/%40esamelson%2Ftest-fetch-update%2F1.0.0%2F48ac93db1a7b9d0aaec894223a36a7fe-27.0.0-ios.js\",\"releaseChannel\":\"default\",\"hostUri\":\"exp.host/@esamelson/test-fetch-update\"}");
        safeCallback.onCachedResponse(response, true);

        return null;
      }
    }).when(exponentHttpClient).tryForcedCachedResponse(Matchers.anyString(), Matchers.any(Request.class), Matchers.any(ExponentHttpClient.SafeCallback.class), Matchers.any(Response.class), Matchers.any(IOException.class));



    doAnswer(new Answer<Void>() {
      @Override
      public Void answer(InvocationOnMock invocation) throws Throwable {
        ExponentHttpClient.SafeCallback safeCallback = invocation.getArgumentAt(2, ExponentHttpClient.SafeCallback.class);

        ManualExpoResponse response = new ManualExpoResponse();
        response.setBody("{\"android\":{\"package\":\"host.exp.testfetchupdate\",\"publishBundlePath\":\"android/app/src/main/assets/shell-app.bundle\",\"publishManifestPath\":\"android/app/src/main/assets/shell-app-manifest.json\"},\"description\":\"This project is really great.\",\"detach\":{\"androidExpoViewUrl\":\"https://s3.amazonaws.com/exp-exponent-view-code/android-v2.5.3-sdk27.0.0-408c8d77-8d1f-4784-b7b4-93826250663a.tar.gz\",\"iosExpoViewUrl\":\"https://s3.amazonaws.com/exp-exponent-view-code/ios-v2.5.10-sdk27.0.0-7e6dd135-e649-48e2-ab7c-e76521ce6259.tar.gz\"},\"icon\":\"./assets/icon.png\",\"iconUrl\":\"https://d1wp6m56sqw74a.cloudfront.net/~assets/fa6577fecc0a7838f15a254577639984\",\"ios\":{\"bundleIdentifier\":\"host.exp.testfetchupdate\",\"publishBundlePath\":\"ios/test-fetch-update/Supporting/shell-app.bundle\",\"publishManifestPath\":\"ios/test-fetch-update/Supporting/shell-app-manifest.json\",\"supportsTablet\":true},\"isDetached\":true,\"locales\":{},\"name\":\"test-fetch-update\",\"orientation\":\"portrait\",\"platforms\":[\"ios\",\"android\"],\"privacy\":\"unlisted\",\"scheme\":\"expd9c42d5111d849f4b99796c00769433d\",\"sdkVersion\":\"27.0.0\",\"slug\":\"test-fetch-update\",\"splash\":{\"backgroundColor\":\"#ffffff\",\"image\":\"./assets/splash.png\",\"imageUrl\":\"https://d1wp6m56sqw74a.cloudfront.net/~assets/43ec0dcbe5a156bf9e650bb8c15e7af6\",\"resizeMode\":\"contain\"},\"updates\":{\"checkAutomatically\":\"ON_ERROR_RECOVERY\",\"fallbackToCacheTimeout\":0},\"version\":\"1.0.0\",\"id\":\"@esamelson/test-fetch-update\",\"revisionId\":\"1.0.0-r.OMmv5zPpWL\",\"publishedTime\":\"2018-05-30T21:43:20.000Z\",\"bundleUrl\":\"https://d1wp6m56sqw74a.cloudfront.net/%40esamelson%2Ftest-fetch-update%2F1.0.0%2F48ac93db1a7b9d0aaec894223a36a7fe-27.0.0-ios.js\",\"releaseChannel\":\"default\",\"hostUri\":\"exp.host/@esamelson/test-fetch-update\"}");
        safeCallback.onCachedResponse(response, true);

        return null;
      }
    }).when(exponentHttpClient).callDefaultCache(Matchers.any(Request.class), Matchers.any(ExponentHttpClient.SafeCallback.class));


    doAnswer(new Answer<Void>() {
      @Override
      public Void answer(InvocationOnMock invocation) throws Throwable {
        ExponentHttpClient.SafeCallback safeCallback = invocation.getArgumentAt(1, ExponentHttpClient.SafeCallback.class);

        ManualExpoResponse response = new ManualExpoResponse();
        response.setBody("{\"android\":{\"package\":\"host.exp.testfetchupdate\",\"publishBundlePath\":\"android/app/src/main/assets/shell-app.bundle\",\"publishManifestPath\":\"android/app/src/main/assets/shell-app-manifest.json\"},\"description\":\"This project is really great.\",\"detach\":{\"androidExpoViewUrl\":\"https://s3.amazonaws.com/exp-exponent-view-code/android-v2.5.3-sdk27.0.0-408c8d77-8d1f-4784-b7b4-93826250663a.tar.gz\",\"iosExpoViewUrl\":\"https://s3.amazonaws.com/exp-exponent-view-code/ios-v2.5.10-sdk27.0.0-7e6dd135-e649-48e2-ab7c-e76521ce6259.tar.gz\"},\"icon\":\"./assets/icon.png\",\"iconUrl\":\"https://d1wp6m56sqw74a.cloudfront.net/~assets/fa6577fecc0a7838f15a254577639984\",\"ios\":{\"bundleIdentifier\":\"host.exp.testfetchupdate\",\"publishBundlePath\":\"ios/test-fetch-update/Supporting/shell-app.bundle\",\"publishManifestPath\":\"ios/test-fetch-update/Supporting/shell-app-manifest.json\",\"supportsTablet\":true},\"isDetached\":true,\"locales\":{},\"name\":\"test-fetch-update\",\"orientation\":\"portrait\",\"platforms\":[\"ios\",\"android\"],\"privacy\":\"unlisted\",\"scheme\":\"expd9c42d5111d849f4b99796c00769433d\",\"sdkVersion\":\"27.0.0\",\"slug\":\"test-fetch-update\",\"splash\":{\"backgroundColor\":\"#ffffff\",\"image\":\"./assets/splash.png\",\"imageUrl\":\"https://d1wp6m56sqw74a.cloudfront.net/~assets/43ec0dcbe5a156bf9e650bb8c15e7af6\",\"resizeMode\":\"contain\"},\"updates\":{\"checkAutomatically\":\"ON_ERROR_RECOVERY\",\"fallbackToCacheTimeout\":0},\"version\":\"1.0.0\",\"id\":\"@esamelson/test-fetch-update\",\"revisionId\":\"1.0.0-r.OMmv5zPpWL\",\"publishedTime\":\"2018-05-30T21:43:20.000Z\",\"bundleUrl\":\"https://d1wp6m56sqw74a.cloudfront.net/%40esamelson%2Ftest-fetch-update%2F1.0.0%2F48ac93db1a7b9d0aaec894223a36a7fe-27.0.0-ios.js\",\"releaseChannel\":\"default\",\"hostUri\":\"exp.host/@esamelson/test-fetch-update\"}");
        safeCallback.onCachedResponse(response, true);

        return null;
      }
    }).when(exponentHttpClient).callSafe(Matchers.any(Request.class), Matchers.any(ExponentHttpClient.SafeCallback.class));



    doAnswer(new Answer<String>() {
      @Override
      public String answer(InvocationOnMock invocation) throws Throwable {
        return null;
      }
    }).when(exponentHttpClient).getHardCodedResponse(Matchers.anyString());


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