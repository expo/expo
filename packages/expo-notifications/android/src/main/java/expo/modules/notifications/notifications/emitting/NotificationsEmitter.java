package expo.modules.notifications.notifications.emitting;

import android.content.Context;
import android.os.Bundle;

import expo.modules.core.ExportedModule;
import expo.modules.core.ModuleRegistry;
import expo.modules.core.Promise;
import expo.modules.core.interfaces.ExpoMethod;
import expo.modules.core.interfaces.services.EventEmitter;

import expo.modules.notifications.notifications.NotificationSerializer;
import expo.modules.notifications.notifications.interfaces.NotificationListener;
import expo.modules.notifications.notifications.interfaces.NotificationManager;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationResponse;

public class NotificationsEmitter extends ExportedModule implements NotificationListener {
  private final static String EXPORTED_NAME = "ExpoNotificationsEmitter";

  private final static String NEW_MESSAGE_EVENT_NAME = "onDidReceiveNotification";
  private final static String NEW_RESPONSE_EVENT_NAME = "onDidReceiveNotificationResponse";
  private final static String MESSAGES_DELETED_EVENT_NAME = "onNotificationsDeleted";

  private NotificationManager mNotificationManager;
  private NotificationResponse mLastNotificationResponse;
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

  @ExpoMethod
  public void getLastNotificationResponseAsync(Promise promise) {
    promise.resolve(mLastNotificationResponse != null ? NotificationSerializer.toBundle(mLastNotificationResponse) : null);
  }

  /**
   * Callback called when {@link NotificationManager} gets notified of a new notification.
   * Emits a {@link NotificationsEmitter#NEW_MESSAGE_EVENT_NAME} event.
   *
   * @param notification Notification received
   */
  @Override
  public void onNotificationReceived(Notification notification) {
    if (mEventEmitter != null) {
      mEventEmitter.emit(NEW_MESSAGE_EVENT_NAME, NotificationSerializer.toBundle(notification));
    }
  }

  /**
   * Callback called when {@link NotificationManager} gets notified of a new notification response.
   * Emits a {@link NotificationsEmitter#NEW_RESPONSE_EVENT_NAME} event.
   *
   * @param response Notification response received
   * @return Whether notification has been handled
   */
  @Override
  public boolean onNotificationResponseReceived(NotificationResponse response) {
    mLastNotificationResponse = response;
    if (mEventEmitter != null) {
      mEventEmitter.emit(NEW_RESPONSE_EVENT_NAME, NotificationSerializer.toBundle(response));
      return true;
    }
    return false;
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
