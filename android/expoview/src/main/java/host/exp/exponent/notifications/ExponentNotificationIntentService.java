package host.exp.exponent.notifications;

import android.app.IntentService;
import android.content.Intent;
import android.util.Log;

import com.facebook.soloader.SoLoader;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

import javax.inject.Inject;

import okhttp3.MediaType;
import okhttp3.Request;
import okhttp3.RequestBody;
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

  public static final String DEVICE_PUSH_TOKEN_KEY = "devicePushToken";
  private static boolean sTokenError = false;

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

  /*
   *  This function MUST set AsyncCondition.notify(DEVICE_PUSH_TOKEN_KEY);
   *  eventually. Otherwise it's possible for us to get in a state where
   *  the AsyncCondition listeners are never called (and the promise from
   *  getExpoPushTokenAsync never resolves).
   */
  @Override
  protected void onHandleIntent(Intent intent) {
    initialize();
    if (mExponentSharedPreferences == null) {
      return;
    }

    try {
      final String token = getToken();

      if (token == null) {
        setTokenError("Device push token is null");
        return;
      }

      String sharedPreferencesToken = mExponentSharedPreferences.getString(getSharedPrefsKey());
      if (sharedPreferencesToken != null && sharedPreferencesToken.equals(token)) {
        // Server already has this token, don't need to send it again.
        AsyncCondition.notify(DEVICE_PUSH_TOKEN_KEY);
        return;
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
        Request request = ExponentUrls.addExponentHeadersToUrl("https://exp.host/--/api/v2/push/updateDeviceToken")
            .header("Content-Type", "application/json")
            .post(body)
            .build();

        mExponentNetwork.getClient().call(request, new ExpoHttpCallback() {
          @Override
          public void onFailure(IOException e) {
            setTokenError(e);
          }

          @Override
          public void onResponse(ExpoResponse response) throws IOException {
            if (!response.isSuccessful()) {
              setTokenError("Failed to update the native device token with the Expo push notification service");
              return;
            }
            mExponentSharedPreferences.setString(getSharedPrefsKey(), token);
            sTokenError = false;
            AsyncCondition.notify(DEVICE_PUSH_TOKEN_KEY);
          }
        });

        Log.i(TAG, getServerType() + " Registration Token: " + token);
      } catch (JSONException e) {
        setTokenError(e);
      }
    } catch (SecurityException e) {
      setTokenError("Are you running in Genymotion? Follow this guide https://inthecheesefactory.com/blog/how-to-install-google-services-on-genymotion/en to install Google Play Services");
    } catch (IOException e) {
      setTokenError(e);
    }
  }

  public static boolean hasTokenError() {
    return sTokenError;
  }

  private void setTokenError(Exception e) {
    sTokenError = true;
    AsyncCondition.notify(DEVICE_PUSH_TOKEN_KEY);
    EXL.e(TAG, e);
  }

  private void setTokenError(String message) {
    sTokenError = true;
    AsyncCondition.notify(DEVICE_PUSH_TOKEN_KEY);
    EXL.e(TAG, message);
  }
}
