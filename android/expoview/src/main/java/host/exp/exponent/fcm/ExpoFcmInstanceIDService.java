package host.exp.exponent.fcm;

import android.content.Intent;

import com.google.firebase.iid.FirebaseInstanceIdService;

public class ExpoFcmInstanceIDService extends FirebaseInstanceIdService {

  @Override
  public void onTokenRefresh() {
    // Fetch updated Instance ID token.
    Intent intent = new Intent(this, FcmRegistrationIntentService.class);
    startService(intent);
  }
}
