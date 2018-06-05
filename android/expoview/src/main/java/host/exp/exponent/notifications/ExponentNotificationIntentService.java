package host.exp.exponent.notifications;

import android.app.IntentService;
import android.content.Intent;
import android.util.Log;

import com.facebook.soloader.SoLoader;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

import javax.inject.Inject;

import expolib_v1.okhttp3.Call;
import expolib_v1.okhttp3.Callback;
import expolib_v1.okhttp3.MediaType;
import expolib_v1.okhttp3.Request;
import expolib_v1.okhttp3.RequestBody;
import expolib_v1.okhttp3.Response;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExponentUrls;
import host.exp.exponent.network.ExpoHttpCallback;
import host.exp.exponent.network.ExpoResponse;
import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponent.utils.AsyncCondition;

public abstract class ExponentNotificationIntentService extends IntentService {

  private static final String TAG = ExponentNotificationIntentService.class.getSimpleName();

  abstract public String getToken() throws IOException;
  abstract public String getSharedPrefsKey();
  abstract public String getServerType();

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Inject
  ExponentNetwork mExponentNetwork;

  public ExponentNotificationIntentService(String name) {
    super(name);
  }

  private void initialize() {
    if (mExponentSharedPreferences != null) {
      return;
    }

    try {
      NativeModuleDepsProvider.getInstance().inject(ExponentNotificationIntentService.class, this);
    } catch (Throwable e) {}
  }

  @Override
  public void onCreate() {
    super.onCreate();
    initialize();
  }

  @Override
  protected void onHandleIntent(Intent intent) {
    initialize();
    if (mExponentSharedPreferences == null) {
      return;
    }

    try {
      final String token = getToken();

      AsyncCondition.notify("devicePushToken");

      if (token == null) {
        EXL.e(TAG, "Device push token is null");
        return;
      }

      String sharedPreferencesToken = mExponentSharedPreferences.getString(getSharedPrefsKey());
      if (sharedPreferencesToken != null && sharedPreferencesToken.equals(token)) {
        // Server already has this token, don't need to send it again.

        // TODO: uncomment this when we're more confident everything is working consistently
        // return;
      }

      // Needed for Arguments.createMap
      SoLoader.init(this, false);

      String uuid = mExponentSharedPreferences.getOrCreateUUID();

      try {
        JSONObject params = new JSONObject();
        params.put("deviceToken", token);
        params.put("deviceId", uuid);
        params.put("appId", getApplicationContext().getPackageName());
        params.put("type", getServerType());

        RequestBody body = RequestBody.create(MediaType.parse("application/json; charset=utf-8"), params.toString());
        Request request = ExponentUrls.addExponentHeadersToUrl("https://exp.host/--/api/v2/push/updateDeviceToken", false, true)
            .header("Content-Type", "application/json")
            .post(body)
            .build();

        mExponentNetwork.getClient().call(request, new ExpoHttpCallback() {
          @Override
          public void onFailure(IOException e) {
            // Don't do anything here. We'll retry next time.
          }

          @Override
          public void onResponse(ExpoResponse response) throws IOException {
            if (response.isSuccessful()) {
              mExponentSharedPreferences.setString(getSharedPrefsKey(), token);
            }
          }
        });

        Log.i(TAG, getServerType() + " Registration Token: " + token);
      } catch (JSONException e) {
        EXL.e(TAG, e);
      }
    } catch (SecurityException e) {
      EXL.e(TAG, "Are you running in Genymotion? Follow this guide https://inthecheesefactory.com/blog/how-to-install-google-services-on-genymotion/en to install Google Play Services");
    } catch (IOException e) {
      EXL.e(TAG, e);
    }
  }
}
