// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.gcm;

import android.os.Bundle;

import com.google.android.gms.gcm.GcmListenerService;

import host.exp.exponent.Constants;
import host.exp.exponent.notifications.*;

import host.exp.exponent.analytics.EXL;
import host.exp.exponent.di.NativeModuleDepsProvider;

public class ExponentGcmListenerService extends GcmListenerService {

  private static final String TAG = ExponentGcmListenerService.class.getSimpleName();

  private static ExponentGcmListenerService sInstance;
  public static ExponentGcmListenerService getInstance() {
    return sInstance;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    NativeModuleDepsProvider.getInstance().inject(ExponentGcmListenerService.class, this);

    sInstance = this;
  }

  @Override
  public void onMessageReceived(String from, Bundle bundle) {
    if (Constants.FCM_ENABLED) {
      return;
    }

    final String body = bundle.getString("body");

    final String experienceId = bundle.getString("experienceId");
    if (experienceId == null) {
      EXL.e(TAG, "No experienceId in push payload.");
      return;
    }

    final String message = bundle.getString("message");
    if (message == null) {
      EXL.e(TAG, "No message in push payload.");
      return;
    }

    final String title = bundle.getString("title");

    final String channelId = bundle.getString("channelId");

    PushNotificationHelper.getInstance().onMessageReceived(this, experienceId, channelId, message, body, title);
  }
}
