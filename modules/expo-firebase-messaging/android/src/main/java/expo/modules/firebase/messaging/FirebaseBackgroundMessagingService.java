package expo.modules.firebase.messaging;

import android.content.Intent;
import android.os.Bundle;
import android.support.annotation.Nullable;

//TODO:Bacon: Remove React Native
import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;
import com.google.firebase.messaging.RemoteMessage;

public class FirebaseBackgroundMessagingService extends HeadlessJsTaskService {
  @Override
  protected @Nullable HeadlessJsTaskConfig getTaskConfig(Intent intent) {
    Bundle extras = intent.getExtras();
    if (extras != null) {
      RemoteMessage message = intent.getParcelableExtra("message");
      WritableMap messageMap = MessagingSerializer.parseRemoteMessage(message);
      return new HeadlessJsTaskConfig("FirebaseBackgroundMessage", messageMap, 60000, false);
    }
    return null;
  }
}
