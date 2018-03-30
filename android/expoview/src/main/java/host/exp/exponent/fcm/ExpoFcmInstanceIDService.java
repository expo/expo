package host.exp.exponent.fcm;

import android.content.Intent;

import com.google.firebase.iid.FirebaseInstanceIdService;

import host.exp.exponent.Constants;

public class ExpoFcmInstanceIDService extends FirebaseInstanceIdService {

  @Override
  public void onTokenRefresh() {
    if (!Constants.FCM_ENABLED) {
      return;
    }

    // Fetch updated Instance ID token.
    Intent intent = new Intent(this, FcmRegistrationIntentService.class);
    startService(intent);
  }
}
