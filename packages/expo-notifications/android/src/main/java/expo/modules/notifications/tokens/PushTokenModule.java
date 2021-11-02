package expo.modules.notifications.tokens;

import android.content.Context;
import android.os.Bundle;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.InstanceIdResult;

import expo.modules.core.ExportedModule;
import expo.modules.core.ModuleRegistry;
import expo.modules.core.Promise;
import expo.modules.core.interfaces.ExpoMethod;
import expo.modules.core.interfaces.services.EventEmitter;

import androidx.annotation.NonNull;
import expo.modules.notifications.tokens.interfaces.PushTokenListener;
import expo.modules.notifications.tokens.interfaces.PushTokenManager;

public class PushTokenModule extends ExportedModule implements PushTokenListener {
  private final static String EXPORTED_NAME = "ExpoPushTokenManager";

  private final static String NEW_TOKEN_EVENT_NAME = "onDevicePushToken";
  private final static String NEW_TOKEN_EVENT_TOKEN_KEY = "devicePushToken";

  private final static String REGISTRATION_FAIL_CODE = "E_REGISTRATION_FAILED";

  private PushTokenManager mPushTokenManager;
  private EventEmitter mEventEmitter;

  public PushTokenModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }


  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mEventEmitter = moduleRegistry.getModule(EventEmitter.class);

    // Register the module as a listener in PushTokenManager singleton module.
    // Deregistration happens in onDestroy callback.
    mPushTokenManager = moduleRegistry.getSingletonModule("PushTokenManager", PushTokenManager.class);
    mPushTokenManager.addListener(this);
  }

  @Override
  public void onDestroy() {
    mPushTokenManager.removeListener(this);
  }

  /**
   * Fetches Firebase push token and resolves the promise.
   *
   * @param promise Promise to be resolved with the token.
   */
  @ExpoMethod
  public void getDevicePushTokenAsync(final Promise promise) {
    FirebaseInstanceId.getInstance().getInstanceId()
        .addOnCompleteListener(new OnCompleteListener<InstanceIdResult>() {
          @Override
          public void onComplete(@NonNull Task<InstanceIdResult> task) {
            if (!task.isSuccessful() || task.getResult() == null) {
              if (task.getException() == null) {
                promise.reject(REGISTRATION_FAIL_CODE, "Fetching the token failed.");
              } else {
                promise.reject(REGISTRATION_FAIL_CODE, "Fetching the token failed: " + task.getException().getMessage(), task.getException());
              }
              return;
            }

            String token = task.getResult().getToken();

            promise.resolve(token);
            onNewToken(token);
          }
        });
  }

  /**
   * Callback called when {@link PushTokenManager} gets notified of a new token.
   * Emits a {@link PushTokenModule#NEW_TOKEN_EVENT_NAME} event.
   *
   * @param token New push token.
   */
  @Override
  public void onNewToken(String token) {
    if (mEventEmitter != null) {
      Bundle eventBody = new Bundle();
      eventBody.putString(NEW_TOKEN_EVENT_TOKEN_KEY, token);
      mEventEmitter.emit(NEW_TOKEN_EVENT_NAME, eventBody);
    }
  }
}
