// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.gcm;

import android.app.IntentService;
import android.content.Intent;
import android.util.Log;

import com.facebook.soloader.SoLoader;
import com.google.android.gms.gcm.GoogleCloudMessaging;
import com.google.android.gms.iid.InstanceID;

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
import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.expoview.Exponent;

public class RegistrationIntentService extends IntentService {

  private static final String TAG = RegistrationIntentService.class.getSimpleName();

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Inject
  ExponentNetwork mExponentNetwork;

  public RegistrationIntentService() {
    super(TAG);
  }

  private void initialize() {
    if (mExponentSharedPreferences != null) {
      return;
    }

    try {
      NativeModuleDepsProvider.getInstance().inject(RegistrationIntentService.class, this);
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
      InstanceID instanceID = InstanceID.getInstance(this);
      final String token = instanceID.getToken(Exponent.getInstance().getGCMSenderId(),
          GoogleCloudMessaging.INSTANCE_ID_SCOPE, null);

      String sharedPreferencesToken = mExponentSharedPreferences.getString(ExponentSharedPreferences.GCM_TOKEN_KEY);
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
        params.put("type", "gcm");

        RequestBody body = RequestBody.create(MediaType.parse("application/json; charset=utf-8"), params.toString());
        Request request = ExponentUrls.addExponentHeadersToUrl("https://exp.host/--/api/v2/push/updateDeviceToken", false, true)
            .header("Content-Type", "application/json")
            .post(body)
            .build();

        mExponentNetwork.getClient().call(request, new Callback() {
          @Override
          public void onFailure(Call call, IOException e) {
            // Don't do anything here. We'll retry next time.
          }

          @Override
          public void onResponse(Call call, Response response) throws IOException {
            if (response.isSuccessful()) {
              mExponentSharedPreferences.setString(ExponentSharedPreferences.GCM_TOKEN_KEY, token);
            }
          }
        });

        Log.i(TAG, "GCM Registration Token: " + token);
      } catch (JSONException e) {
        EXL.e(TAG, e);
      }
    } catch (IOException e) {
      EXL.e(TAG, e.getMessage());
    } catch (SecurityException e) {
      EXL.e(TAG, "Are you running in Genymotion? Follow this guide https://inthecheesefactory.com/blog/how-to-install-google-services-on-genymotion/en to install Google Play Services");
    }
  }
}
