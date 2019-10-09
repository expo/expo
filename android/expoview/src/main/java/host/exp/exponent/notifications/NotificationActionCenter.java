package host.exp.exponent.notifications;

import android.app.Notification;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Looper;
import androidx.core.app.NotificationCompat;
import androidx.core.app.RemoteInput;

import com.raizlabs.android.dbflow.sql.language.SQLite;
import com.raizlabs.android.dbflow.sql.language.Select;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import host.exp.exponent.kernel.KernelConstants;

public class NotificationActionCenter {
  public static final String KEY_TEXT_REPLY = "notification_remote_input";

  public synchronized static void putCategory(String categoryId, List<Map<String, Object>> actions) {
    throwExceptionIfOnMainThread();
    for (int i = 0; i < actions.size(); i++) {
      Map<String, Object> action = actions.get(i);
      action.put("categoryId", categoryId);
      ActionObject actionObject = new ActionObject(action, i);
      actionObject.save();
    }
  }

  public synchronized static void removeCategory(String categoryId) {
    List<ActionObject> actions = SQLite.select().from(ActionObject.class)
        .where(ActionObject_Table.categoryId.eq(categoryId))
        .queryList();
    for (ActionObject actionObject : actions) {
      actionObject.delete();
    }
  }

  public synchronized static void setCategory(String categoryId, NotificationCompat.Builder builder, Context context, IntentProvider intentProvider) {
    throwExceptionIfOnMainThread();

    // Expo Client has a permanent notification, so we have to set max priority in order to show up buttons
    builder.setPriority(Notification.PRIORITY_MAX);

    List<ActionObject> actions = new Select().from(ActionObject.class)
        .where(ActionObject_Table.categoryId.eq(categoryId))
        .orderBy(ActionObject_Table.position, true)
        .queryList();

    for (ActionObject actionObject : actions) {
      addAction(builder, actionObject, intentProvider, context);
    }
  }

  private static void addAction(NotificationCompat.Builder builder, ActionObject actionObject, IntentProvider intentProvider, Context context) {
    Intent intent = intentProvider.provide();

    String actionId = actionObject.getActionId();

    intent.putExtra(KernelConstants.NOTIFICATION_ACTION_TYPE_KEY, actionId);
    PendingIntent pendingIntent = PendingIntent.getActivity(context, UUID.randomUUID().hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT);

    NotificationCompat.Action.Builder actionBuilder = new NotificationCompat.Action.Builder(0,
        actionObject.getButtonTitle(),
        pendingIntent
    );

    if (actionObject.isShouldShowTextInput()) {
      actionBuilder.addRemoteInput(
          new RemoteInput.Builder(KEY_TEXT_REPLY)
              .setLabel(actionObject.getPlaceholder())
              .build()
      );
    }

    builder.addAction(actionBuilder.build());
  }

  private static void throwExceptionIfOnMainThread() {
    if (Looper.myLooper() == Looper.getMainLooper()) {
      throw new RuntimeException("Do not use NotificationActionCenter class on the main thread!");
    }
  }
}
