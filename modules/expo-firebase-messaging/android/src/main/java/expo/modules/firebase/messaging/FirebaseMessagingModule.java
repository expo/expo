package expo.modules.firebase.messaging;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.v4.content.LocalBroadcastManager;
import android.util.Log;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;
import java.util.Set;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ActivityProvider;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.LifecycleEventListener;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.UIManager;
import expo.modules.firebase.app.Utils;

public class FirebaseMessagingModule extends ExportedModule implements ModuleRegistryConsumer, LifecycleEventListener {

  private final static String TAG = FirebaseMessagingModule.class.getCanonicalName();

  private ModuleRegistry mModuleRegistry;
  private Boolean isDestroyed = false;

  public FirebaseMessagingModule(Context context) {
    super(context);

    LocalBroadcastManager localBroadcastManager = LocalBroadcastManager.getInstance(context);

    // Subscribe to message events
    localBroadcastManager.registerReceiver(new MessageReceiver(),
        new IntentFilter(EXFirebaseMessagingService.MESSAGE_EVENT));

    // Subscribe to token refresh events
    localBroadcastManager.registerReceiver(new RefreshTokenReceiver(),
        new IntentFilter(EXFirebaseInstanceIdService.TOKEN_REFRESH_EVENT));
  }

  @Override
  public String getName() {
    return "ExpoFirebaseMessaging";
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    // Unregister from old UIManager
    if (mModuleRegistry != null && mModuleRegistry.getModule(UIManager.class) != null) {
      mModuleRegistry.getModule(UIManager.class).unregisterLifecycleEventListener(this);
    }

    mModuleRegistry = moduleRegistry;

    // Register to new UIManager
    if (mModuleRegistry != null && mModuleRegistry.getModule(UIManager.class) != null) {
      mModuleRegistry.getModule(UIManager.class).registerLifecycleEventListener(this);
    }
  }

  protected final Context getApplicationContext() {
    return getCurrentActivity().getApplicationContext();
  }

  final Activity getCurrentActivity() {
    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    return activityProvider.getCurrentActivity();
  }

  @ExpoMethod
  public void sendMessage(Map<String, Object> messageMap, Promise promise) {
    if (!messageMap.containsKey("to")) {
      promise.reject("messaging/invalid-message", "The supplied message is missing a 'to' field");
      return;
    }

    RemoteMessage.Builder mb = new RemoteMessage.Builder((String) messageMap.get("to"));

    if (messageMap.containsKey("collapseKey")) {
      mb = mb.setCollapseKey((String) messageMap.get("collapseKey"));
    }
    if (messageMap.containsKey("messageId")) {
      mb = mb.setMessageId((String) messageMap.get("messageId"));
    }
    if (messageMap.containsKey("messageType")) {
      mb = mb.setMessageType((String) messageMap.get("messageType"));
    }
    if (messageMap.containsKey("ttl")) {
      mb = mb.setTtl((Integer) messageMap.get("ttl"));
    }
    if (messageMap.containsKey("data")) {
      Map<String, Object> dataMap = (Map<String, Object>) messageMap.get("data");
      Set<String> iterator = dataMap.keySet();
      for (String key : iterator) {
        mb = mb.addData(key, (String) dataMap.get(key));
      }
    }

    FirebaseMessaging.getInstance().send(mb.build());

    // TODO: Listen to onMessageSent and onSendError for better feedback?
    promise.resolve(null);
  }

  @ExpoMethod
  public void subscribeToTopic(String topic, final Promise promise) {
    FirebaseMessaging.getInstance().subscribeToTopic(topic).addOnCompleteListener(new OnCompleteListener<Void>() {
      @Override
      public void onComplete(@NonNull Task<Void> task) {
        if (task.isSuccessful()) {
          Log.d(TAG, "subscribeToTopic:onComplete:success");
          promise.resolve(null);
        } else {
          Exception exception = task.getException();
          Log.e(TAG, "subscribeToTopic:onComplete:failure", exception);
          promise.reject(exception);
        }
      }
    });
  }

  @ExpoMethod
  public void unsubscribeFromTopic(String topic, final Promise promise) {
    FirebaseMessaging.getInstance().unsubscribeFromTopic(topic).addOnCompleteListener(new OnCompleteListener<Void>() {
      @Override
      public void onComplete(@NonNull Task<Void> task) {
        if (task.isSuccessful()) {
          Log.d(TAG, "unsubscribeFromTopic:onComplete:success");
          promise.resolve(null);
        } else {
          Exception exception = task.getException();
          Log.e(TAG, "unsubscribeFromTopic:onComplete:failure", exception);
          promise.reject(exception);
        }
      }
    });
  }

  @Override
  public void onHostResume() {

  }

  @Override
  public void onHostPause() {

  }

  @Override
  public void onHostDestroy() {
    isDestroyed = true;
  }

  private class MessageReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
      if (!isDestroyed) {
        Log.d(TAG, "Received new message");

        RemoteMessage message = intent.getParcelableExtra("message");
        Bundle messageMap = MessagingSerializer.parseRemoteMessageToBundle(message);

        Utils.sendEvent(mModuleRegistry, "messaging_message_received", messageMap);
      }
    }
  }

  private class RefreshTokenReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
      if (!isDestroyed) {
        String token = FirebaseInstanceId.getInstance().getToken();
        Log.d(TAG, "Received new FCM token: " + token);

        // TODO: Evan: Verify this shape can work. Was string originally but EXCore
        // needs a Bundle not Object.
        Bundle tokenPayload = new Bundle();
        tokenPayload.putString("token", token);

        Utils.sendEvent(mModuleRegistry, "messaging_token_refreshed", tokenPayload);
      }
    }
  }
}
