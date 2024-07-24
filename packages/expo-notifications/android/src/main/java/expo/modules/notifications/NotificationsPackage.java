package expo.modules.notifications;

import android.content.Context;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import expo.modules.core.BasePackage;
import expo.modules.core.interfaces.InternalModule;
import expo.modules.core.interfaces.ReactActivityLifecycleListener;
import expo.modules.core.interfaces.SingletonModule;
import expo.modules.notifications.notifications.NotificationManager;
import expo.modules.notifications.notifications.categories.serializers.ExpoNotificationsCategoriesSerializer;
import expo.modules.notifications.notifications.channels.AndroidXNotificationsChannelsProvider;
import expo.modules.notifications.service.delegates.ExpoNotificationLifecycleListener;
import expo.modules.notifications.tokens.PushTokenManager;

public class NotificationsPackage extends BasePackage {

  private NotificationManager mNotificationManager;

  public NotificationsPackage() {
    mNotificationManager = new NotificationManager();
  }

  @Override
  public List<SingletonModule> createSingletonModules(Context context) {
    return Arrays.asList(
      new PushTokenManager(),
      mNotificationManager
    );
  }

  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Arrays.asList(
      new AndroidXNotificationsChannelsProvider(context),
      new ExpoNotificationsCategoriesSerializer()
    );
  }

  @Override
  public List<ReactActivityLifecycleListener> createReactActivityLifecycleListeners(Context activityContext) {
    return Collections.singletonList(new ExpoNotificationLifecycleListener(activityContext, mNotificationManager));
  }
}

