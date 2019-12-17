package expo.modules.notifications;

import android.content.Context;
import android.os.Bundle;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.InstanceIdResult;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.services.EventEmitter;

import androidx.annotation.NonNull;

public class PushTokenModule extends ExportedModule implements PushTokenListener {
  private PushTokenManager mPushTokenManager;
  private EventEmitter mEventEmitter;

  public PushTokenModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoPushTokenManager";
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mPushTokenManager = moduleRegistry.getSingletonModule("PushTokenManager", PushTokenManager.class);
    mEventEmitter = moduleRegistry.getModule(EventEmitter.class);
  }

  @ExpoMethod
  public void startObserving(Promise promise) {
    mPushTokenManager.addListener(this);
    promise.resolve(null);
  }

  @ExpoMethod
  public void stopObserving(Promise promise) {
    mPushTokenManager.removeListener(this);
    promise.resolve(null);
  }

  @ExpoMethod
  public void getDevicePushTokenAsync(final Promise promise) {
    FirebaseInstanceId.getInstance().getInstanceId()
        .addOnCompleteListener(new OnCompleteListener<InstanceIdResult>() {
          @Override
          public void onComplete(@NonNull Task<InstanceIdResult> task) {
            if (!task.isSuccessful()) {
              if (task.getException() == null) {
                promise.reject("E_REGISTER_FAIL", "Fetching the token failed.");
              } else {
                promise.reject("E_REGISTER_FAIL", "Fetching the token failed: " + task.getException().getMessage(), task.getException());
              }
              return;
            }

            if (task.getResult() == null) {
              promise.reject("E_REGISTER_FAIL", "Fetching the token failed.");
              return;
            }

            promise.resolve(task.getResult().getToken());
          }
        });
  }

  @Override
  public void onNewToken(String token) {
    if (mEventEmitter != null) {
      Bundle eventBody = new Bundle();
      eventBody.putString("devicePushToken", token);
      mEventEmitter.emit("onDevicePushToken", eventBody);
    }
  }
}
