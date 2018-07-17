package host.exp.exponent.fcm;

import android.content.Context;
import android.support.annotation.NonNull;
import android.util.Log;

import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.InstanceIdResult;

import java.io.IOException;

import host.exp.exponent.notifications.ExponentNotificationIntentService;
import host.exp.exponent.storage.ExponentSharedPreferences;

public class FcmRegistrationIntentService extends ExponentNotificationIntentService {

  private static final String TAG = FcmRegistrationIntentService.class.getSimpleName();

  public FcmRegistrationIntentService() {
    super(TAG);
  }

  String mToken = null;

  @Override
  public String getToken() throws IOException {
    if (mToken == null) {
      throw new IOException("No FCM token found");
    }

    Log.d("FCM Device Token", mToken);
    return mToken;
  }

  @Override
  public String getSharedPrefsKey() {
    return ExponentSharedPreferences.FCM_TOKEN_KEY;
  }

  @Override
  public String getServerType() {
    return "fcm";
  }

  public static void getTokenAndRegister(final Context context) {
    FirebaseInstanceId.getInstance().getInstanceId().addOnSuccessListener(new OnSuccessListener<InstanceIdResult>() {
      @Override
      public void onSuccess(InstanceIdResult instanceIdResult) {
        registerForeground(context, instanceIdResult.getToken());
      }
    }).addOnFailureListener(new OnFailureListener() {
      @Override
      public void onFailure(@NonNull Exception e) {
        Log.e("FCM Device Token", "Error calling getInstanceId " + e.getLocalizedMessage());
      }
    });
  }

  public static void registerForeground(final Context context, final String token) {
    FcmRegistrationIntentService fcmRegistrationIntentService = new FcmRegistrationIntentService();
    fcmRegistrationIntentService.attachBaseContext(context);
    fcmRegistrationIntentService.mToken = token;
    fcmRegistrationIntentService.onHandleIntent(null);
  }
}
