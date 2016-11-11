// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.gcm;

import android.app.IntentService;
import android.content.Intent;
import android.util.Log;

import com.google.android.gms.gcm.GoogleCloudMessaging;
import com.google.android.gms.iid.InstanceID;

import java.io.IOException;

import javax.inject.Inject;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExponentKernelModuleProvider;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponentview.Exponent;

import com.facebook.soloader.SoLoader;

public class RegistrationIntentService extends IntentService {

  private static final String TAG = RegistrationIntentService.class.getSimpleName();

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  public RegistrationIntentService() {
    super(TAG);
  }

  @Override
  public void onCreate() {
    super.onCreate();
    NativeModuleDepsProvider.getInstance().inject(RegistrationIntentService.class, this);
  }

  @Override
  protected void onHandleIntent(Intent intent) {
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
      WritableMap params = Arguments.createMap();
      params.putString("deviceToken", token);
      params.putString("deviceId", uuid);
      ExponentKernelModuleProvider.queueEvent("ExponentKernel.updateDeviceToken", params, new ExponentKernelModuleProvider.KernelEventCallback() {
        @Override
        public void onEventSuccess(ReadableMap result) {
          mExponentSharedPreferences.setString(ExponentSharedPreferences.GCM_TOKEN_KEY, token);
        }

        @Override
        public void onEventFailure(String errorMessage) {
          // Don't do anything here. We'll retry next time.
        }
      });

      Log.i(TAG, "GCM Registration Token: " + token);
    } catch (IOException e) {
      EXL.e(TAG, e.getMessage());
    }
  }
}
