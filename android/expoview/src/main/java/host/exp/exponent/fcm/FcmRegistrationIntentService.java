package host.exp.exponent.fcm;

import android.util.Log;

import com.google.firebase.iid.FirebaseInstanceId;

import java.io.IOException;

import host.exp.exponent.notifications.ExponentNotificationIntentService;
import host.exp.exponent.storage.ExponentSharedPreferences;

public class FcmRegistrationIntentService extends ExponentNotificationIntentService {

  private static final String TAG = FcmRegistrationIntentService.class.getSimpleName();

  public FcmRegistrationIntentService() {
    super(TAG);
  }

  @Override
  public String getToken() throws IOException {
    String token = FirebaseInstanceId.getInstance().getToken();
    Log.d("FCM Device Token", token);
    return token;
  }

  @Override
  public String getSharedPrefsKey() {
    return ExponentSharedPreferences.FCM_TOKEN_KEY;
  }

  @Override
  public String getServerType() {
    return "fcm";
  }
}
