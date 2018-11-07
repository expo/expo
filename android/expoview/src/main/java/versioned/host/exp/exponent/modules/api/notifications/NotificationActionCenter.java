package versioned.host.exp.exponent.modules.api.notifications;

import android.app.Notification;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Looper;
import android.support.v4.app.NotificationCompat;
import android.support.v4.app.RemoteInput;

import com.raizlabs.android.dbflow.sql.builder.Condition;
import com.raizlabs.android.dbflow.sql.language.Select;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.TreeMap;
import java.util.UUID;

import host.exp.expoview.BuildConfig;

public class NotificationActionCenter {
  
  public static final String KEY_TEXT_REPLY = "notification_remote_input";

  public synchronized static void put(String categoryId, ArrayList<HashMap<String, Object>> actions, Context context) {
    throwExceptionIfOnMainThread();
    for(HashMap<String, Object> action: actions) {
      action.put("categoryId", categoryId);
      ActionObject actionObject= new ActionObject();
      actionObject.populateObjectWithDataFromMap(action);
      actionObject.save();
    }
  }

  public synchronized static void setCategory(String categoryId, NotificationCompat.Builder builder, Context context, IntentProvider intentProvider) {
    throwExceptionIfOnMainThread();

    // Because expo have ongoing notification we have to change priority in order to show up buttons
    builder.setPriority(Notification.PRIORITY_MAX);

    List<ActionObject> actions = new Select().from(ActionObject.class)
                                     .where(Condition.column(ActionObject$Table.CATEGORYID).is(categoryId))
                                     .queryList();

    for(ActionObject actionObject : actions) {
      addAction(builder, actionObject, intentProvider, context);
    }
  }

  private static void addAction(NotificationCompat.Builder builder, ActionObject actionObject, IntentProvider intentProvider, Context context) {
    TreeMap<String, String> action = new TreeMap<>();
    Intent intent = intentProvider.provide();

    String actionId = actionObject.getActionId();

    intent.putExtra("actionType", actionId);
    PendingIntent pendingIntent = PendingIntent.getActivity(context, UUID.randomUUID().hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT);

    NotificationCompat.Action.Builder actionBuilder = new NotificationCompat.Action.Builder(0,
        actionObject.getButtonTitle(),
        pendingIntent
    );

    if (actionObject.getContainTextInput()) {
      RemoteInput.Builder remoteInputBuilder = new RemoteInput.Builder(KEY_TEXT_REPLY);
      if (actionObject.getPlaceholder() != null) {
        remoteInputBuilder.setLabel(actionObject.getPlaceholder());
      }
      RemoteInput remoteInput = remoteInputBuilder.build();
      actionBuilder.addRemoteInput(remoteInput);
    }

    NotificationCompat.Action notificationAction = actionBuilder.build();
    builder.addAction(notificationAction);
  }

  private static void throwExceptionIfOnMainThread() {
    if (Looper.myLooper() == Looper.getMainLooper()) {
      throw new RuntimeException("Do not use NotificationActionCenter class on main thread!");
    }
  }
}
