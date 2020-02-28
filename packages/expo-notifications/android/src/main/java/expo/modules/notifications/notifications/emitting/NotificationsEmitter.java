package expo.modules.notifications.notifications.emitting;

import android.content.Context;
import android.os.Bundle;

import org.json.JSONObject;
import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.interfaces.services.EventEmitter;

import expo.modules.notifications.notifications.NotificationSerializer;
import expo.modules.notifications.notifications.interfaces.NotificationListener;
import expo.modules.notifications.notifications.interfaces.NotificationManager;
import expo.modules.notifications.notifications.interfaces.NotificationTrigger;

public class NotificationsEmitter extends ExportedModule implements NotificationListener {
  private final static String EXPORTED_NAME = "ExpoNotificationsEmitter";

  private final static String NEW_MESSAGE_EVENT_NAME = "onDidReceiveNotification";
  private final static String MESSAGES_DELETED_EVENT_NAME = "onNotificationsDeleted";

  private NotificationManager mNotificationManager;
  private EventEmitter mEventEmitter;

  public NotificationsEmitter(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mEventEmitter = moduleRegistry.getModule(EventEmitter.class);

    // Register the module as a listener in NotificationManager singleton module.
    // Deregistration happens in onDestroy callback.
    mNotificationManager = moduleRegistry.getSingletonModule("NotificationManager", NotificationManager.class);
    mNotificationManager.addListener(this);
  }

  @Override
  public void onDestroy() {
    mNotificationManager.removeListener(this);
  }

  /**
   * Callback called when {@link NotificationManager} gets notified of a new notification.
   * Emits a {@link NotificationsEmitter#NEW_MESSAGE_EVENT_NAME} event.
   *
   * @param identifier Notification identifier
   * @param request    Notification request
   * @param trigger    Notification trigger
   */
  @Override
  public void onNotificationReceived(String identifier, JSONObject request, NotificationTrigger trigger) {
    if (mEventEmitter != null) {
      mEventEmitter.emit(NEW_MESSAGE_EVENT_NAME, NotificationSerializer.toBundle(identifier, request, trigger));
    }
  }

  /**
   * Callback called when {@link NotificationManager} gets informed of the fact of message dropping.
   * Emits a {@link NotificationsEmitter#MESSAGES_DELETED_EVENT_NAME} event.
   */
  @Override
  public void onNotificationsDropped() {
    if (mEventEmitter != null) {
      mEventEmitter.emit(MESSAGES_DELETED_EVENT_NAME, Bundle.EMPTY);
    }
  }
}
