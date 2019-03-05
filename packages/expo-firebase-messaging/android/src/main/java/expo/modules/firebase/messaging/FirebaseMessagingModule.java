package expo.modules.firebase.messaging;

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

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.LifecycleEventListener;
import org.unimodules.core.interfaces.ModuleRegistryConsumer;
import org.unimodules.core.interfaces.services.UIManager;
import expo.modules.firebase.app.Utils;

public class FirebaseMessagingModule extends ExportedModule implements ModuleRegistryConsumer, LifecycleEventListener {

    private final static String TAG = FirebaseMessagingModule.class.getCanonicalName();

    private ModuleRegistry mModuleRegistry;
    private Boolean isDestroyed = false;

    private MessageReceiver mMessageReceiver = null;

    public FirebaseMessagingModule(Context context) {
        super(context);
    }

    @Override
    public String getName() {
        return "ExpoFirebaseMessaging";
    }

    @Override
    public void setModuleRegistry(ModuleRegistry moduleRegistry) {
        // Unregister from old UIManager
        if (mModuleRegistry != null) {
            if (mModuleRegistry.getModule(UIManager.class) != null) {
                mModuleRegistry.getModule(UIManager.class).unregisterLifecycleEventListener(this);
            }

            LocalBroadcastManager localBroadcastManager = LocalBroadcastManager.getInstance(getContext());

            if (mMessageReceiver != null) {
                localBroadcastManager.unregisterReceiver(mMessageReceiver);
                mMessageReceiver = null;
            }
        }

        mModuleRegistry = moduleRegistry;

        // Register to new UIManager
        if (mModuleRegistry != null) {
            if (mModuleRegistry.getModule(UIManager.class) != null) {
                mModuleRegistry.getModule(UIManager.class).registerLifecycleEventListener(this);
            }

            LocalBroadcastManager localBroadcastManager = LocalBroadcastManager.getInstance(getContext());

            mMessageReceiver = new MessageReceiver();
            // Subscribe to message events
            localBroadcastManager.registerReceiver(mMessageReceiver,
                    new IntentFilter(EXFirebaseMessagingService.MESSAGE_EVENT));
        }
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
            // TODO: Bacon: this is broken - should be Double
            /// https://github.com/expo/expo/issues/2641
            Number mTTL = (Number) messageMap.get("ttl");
            mb = mb.setTtl(mTTL.intValue());
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
        FirebaseMessaging.getInstance().unsubscribeFromTopic(topic)
                .addOnCompleteListener(new OnCompleteListener<Void>() {
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
                if (intent.hasExtra("message")) {
                    RemoteMessage message = intent.getParcelableExtra("message");
                    Log.d(TAG, "Received new message");
                    Bundle messageMap = MessagingSerializer.parseRemoteMessageToBundle(message);

                    Utils.sendEvent(mModuleRegistry, "Expo.Firebase.messaging_message_received", messageMap);
                } else {
                    // TODO: Bacon: Remove deprecated `getToken()`
                    String token = FirebaseInstanceId.getInstance().getToken();
                    Log.d(TAG, "Received new FCM token: " + token);

                    Bundle tokenPayload = new Bundle();
                    tokenPayload.putString("token", token);

                    Utils.sendEvent(mModuleRegistry, "Expo.Firebase.messaging_token_refreshed", tokenPayload);
                }

            }
        }
    }
}
