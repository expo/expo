// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.gcm;

import android.content.Intent;

import com.google.android.gms.iid.InstanceIDListenerService;

import host.exp.exponent.Constants;

public class ExponentInstanceIDListenerService extends InstanceIDListenerService {

  @Override
  public void onTokenRefresh() {
    if (Constants.FCM_ENABLED) {
      return;
    }

    // Fetch updated Instance ID token.
    Intent intent = new Intent(this, GcmRegistrationIntentService.class);
    startService(intent);
  }
}
