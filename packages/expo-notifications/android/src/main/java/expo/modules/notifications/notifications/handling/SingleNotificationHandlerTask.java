package expo.modules.notifications.notifications.handling;

import android.app.Notification;
import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import com.google.firebase.messaging.RemoteMessage;

import org.json.JSONObject;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.services.EventEmitter;

import java.util.UUID;

import androidx.core.app.NotificationManagerCompat;
import expo.modules.notifications.notifications.RemoteMessageSerializer;
import expo.modules.notifications.notifications.interfaces.NotificationBehavior;
import expo.modules.notifications.notifications.interfaces.NotificationBuilderFactory;

/**
 * A "task" responsible for managing response to a single notification.
 */
/* package */ class SingleNotificationHandlerTask {
  /**
   * {@link Handler} on which lifecycle events are executed.
   */
  private final static Handler HANDLER = new Handler(Looper.getMainLooper());

  /**
   * Name of the event asking the delegate for behavior.
   */
  private final static String HANDLE_NOTIFICATION_EVENT_NAME = "onHandleNotification";
  /**
   * Name of the event emitted if the delegate doesn't respond in time.
   */
  private final static String HANDLE_NOTIFICATION_TIMEOUT_EVENT_NAME = "onHandleNotificationTimeout";

  /**
   * Seconds since sending the {@link #HANDLE_NOTIFICATION_EVENT_NAME} until the task
   * is considered timed out.
   */
  private final static int SECONDS_TO_TIMEOUT = 3;

  private Context mContext;
  private EventEmitter mEventEmitter;
  private RemoteMessage mRemoteMessage;
  private NotificationBehavior mBehavior;
  private NotificationsHandler mDelegate;
  private NotificationBuilderFactory mBuilderFactory;
  private String mIdentifier;

  private Runnable mTimeoutRunnable = new Runnable() {
    @Override
    public void run() {
      SingleNotificationHandlerTask.this.handleTimeout();
    }
  };

  /* package */ SingleNotificationHandlerTask(Context context, ModuleRegistry moduleRegistry, RemoteMessage remoteMessage, NotificationsHandler delegate) {
    mContext = context;
    mBuilderFactory = moduleRegistry.getModule(NotificationBuilderFactory.class);
    mEventEmitter = moduleRegistry.getModule(EventEmitter.class);
    mRemoteMessage = remoteMessage;
    mDelegate = delegate;

    mIdentifier = remoteMessage.getMessageId();
    if (mIdentifier == null) {
      mIdentifier = UUID.randomUUID().toString();
    }
  }

  /**
   * @return Identifier of the task ({@link RemoteMessage#getMessageId()} or a random {@link UUID}
   * if {@link RemoteMessage#getMessageId() is null.
   */
  /* package */ String getIdentifier() {
    return mIdentifier;
  }

  /**
   * Starts the task, i.e. sends an event to the app's delegate and starts a timeout
   * after which the task finishes itself.
   */
  /* package */ void start() {
    Bundle eventBody = new Bundle();
    eventBody.putString("id", getIdentifier());
    eventBody.putBundle("notification", RemoteMessageSerializer.toBundle(mRemoteMessage));
    mEventEmitter.emit(HANDLE_NOTIFICATION_EVENT_NAME, eventBody);

    HANDLER.postDelayed(mTimeoutRunnable, SECONDS_TO_TIMEOUT * 1000);
  }

  /**
   * Stops the task abruptly (in case the app is being destroyed and there is no reason
   * to wait for the response anymore).
   */
  /* package */ void stop() {
    finish();
  }

  /**
   * Informs the task of a response - behavior requested by the app.
   *
   * @param behavior Behavior requested by the app
   * @param promise  Promise to fulfill once the behavior is applied to the notification.
   */
  /* package */ void handleResponse(final NotificationBehavior behavior, final Promise promise) {
    mBehavior = behavior;
    HANDLER.post(new Runnable() {
      @Override
      public void run() {
        try {
          Notification notification = getNotification();
          String tag = getIdentifier();
          int id = 0;
          try {
            NotificationManagerCompat.from(mContext).notify(tag, id, notification);
            promise.resolve(null);
          } catch (IllegalArgumentException e) {
            promise.reject("ERR_NOTIFICATION_PRESENTATION_FAILED", "Notification presentation failed, notification was malformed: " + e.getMessage(), e);
          }
        } catch (NullPointerException e) {
          promise.reject("ERR_NOTIFICATION_PRESENTATION_FAILED", e);
        } finally {
          finish();
        }
      }
    });
  }

  /**
   * Callback called by {@link #mTimeoutRunnable} after timeout time elapses.
   * <p>
   * Sends a timeout event to the app.
   */
  private void handleTimeout() {
    Bundle eventBody = new Bundle();
    eventBody.putString("id", getIdentifier());
    eventBody.putBundle("notification", RemoteMessageSerializer.toBundle(mRemoteMessage));
    mEventEmitter.emit(HANDLE_NOTIFICATION_TIMEOUT_EVENT_NAME, eventBody);

    finish();
  }

  /**
   * Callback called when the task fulfills its responsibility. Clears up {@link #HANDLER}
   * and informs {@link #mDelegate} of the task's state.
   */
  private void finish() {
    HANDLER.removeCallbacks(mTimeoutRunnable);
    mDelegate.onTaskFinished(this);
  }

  private Notification getNotification() {
    return mBuilderFactory.createBuilder(mContext)
        .setNotificationRequest(new JSONObject(mRemoteMessage.getData()))
        .setAllowedBehavior(mBehavior)
        .build();
  }
}
