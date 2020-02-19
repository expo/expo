package expo.modules.notifications.notifications.emitting;

import android.content.Context;
import android.os.Bundle;

import com.google.firebase.messaging.RemoteMessage;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.interfaces.services.EventEmitter;

import expo.modules.notifications.notifications.RemoteMessageSerializer;
import expo.modules.notifications.notifications.interfaces.NotificationListener;
import expo.modules.notifications.notifications.interfaces.NotificationManager;

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
   * Callback called when {@link NotificationManager} gets notified of a new message.
   * Emits a {@link NotificationsEmitter#NEW_MESSAGE_EVENT_NAME} event.
   *
   * @param message New remote message.
   */
  @Override
  public void onMessage(RemoteMessage message) {
    if (mEventEmitter != null) {
      mEventEmitter.emit(NEW_MESSAGE_EVENT_NAME, RemoteMessageSerializer.toBundle(message));
    }
  }

  /**
   * Callback called when {@link NotificationManager} gets informed of the fact of message dropping.
   * Emits a {@link NotificationsEmitter#MESSAGES_DELETED_EVENT_NAME} event.
   */
  @Override
  public void onDeletedMessages() {
    if (mEventEmitter != null) {
      mEventEmitter.emit(MESSAGES_DELETED_EVENT_NAME, Bundle.EMPTY);
    }
  }
}
