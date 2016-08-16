// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.gcm;

import android.content.Intent;

import com.google.android.gms.iid.InstanceIDListenerService;

public class ExponentInstanceIDListenerService extends InstanceIDListenerService {

  @Override
  public void onTokenRefresh() {
    // Fetch updated Instance ID token.
    Intent intent = new Intent(this, RegistrationIntentService.class);
    startService(intent);
  }
}
