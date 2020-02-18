package expo.modules.notifications.notifications.presentation;

import android.app.Notification;
import android.content.Context;

import org.json.JSONObject;
import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;

import java.util.Map;

import androidx.core.app.NotificationManagerCompat;
import expo.modules.notifications.notifications.interfaces.NotificationBuilderFactory;

public class ExpoNotificationPresentationModule extends ExportedModule {
  private static final String EXPORTED_NAME = "ExpoNotificationPresenter";

  private NotificationBuilderFactory mNotificationBuilderFactory;

  public ExpoNotificationPresentationModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mNotificationBuilderFactory = moduleRegistry.getModule(NotificationBuilderFactory.class);
  }

  @ExpoMethod
  public void presentNotificationAsync(String identifier, Map notificationSpec, Promise promise) {
    if (mNotificationBuilderFactory == null) {
      promise.reject("ERR_NOTIFICATION_BUILDER_UNAVAILABLE", "NotificationBuilder class could not be found.");
      return;
    }
    JSONObject notificationRequest = new JSONObject(notificationSpec);
    Notification notification = mNotificationBuilderFactory
        .createBuilder(getContext())
        .setNotificationRequest(notificationRequest)
        .build();
    NotificationManagerCompat.from(getContext()).notify(identifier, 0, notification);
    promise.resolve(null);
  }
}
