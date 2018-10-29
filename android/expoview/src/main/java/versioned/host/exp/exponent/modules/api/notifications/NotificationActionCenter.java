package versioned.host.exp.exponent.modules.api.notifications;

import android.app.Notification;
import android.app.PendingIntent;
import android.arch.persistence.room.Room;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Looper;
import android.support.v4.app.NotificationCompat;
import android.support.v4.app.RemoteInput;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.UUID;

import host.exp.expoview.BuildConfig;

public class NotificationActionCenter {

  private static final String SHARED_PREFERENCES_FILE = "com.expo.notification.action" + BuildConfig.APPLICATION_ID;
  public static final String KEY_TEXT_REPLY = "notification_remote_input";
  private static ActionDatabase db;
  private static final String DATABASE_NAME = "expo.notification.action";

  public synchronized static void put(String categoryId, ArrayList<HashMap<String, Object>> actions, Context context) {
    throwExceptionIfOnMainThread();

    SharedPreferences sharedPreferences = context.getSharedPreferences(SHARED_PREFERENCES_FILE, Context.MODE_PRIVATE);
    SharedPreferences.Editor editor = sharedPreferences.edit();

    TreeSet<String> actionIds = new TreeSet<>();

    for(HashMap<String, Object> action: actions) {
      String actionId = (String)action.get("actionId");
      actionIds.add(actionId);

      ActionObject actionObject= new ActionObject();
      actionObject.populateObjectWithDataFromMap(action);
      getDb(context).mActionObjectDao().insertActions(actionObject);
    }

    editor.putStringSet(categoryId, actionIds);
    editor.apply();
  }

  public synchronized static void setCategory(String categoryId, NotificationCompat.Builder builder, Context context, IntentProvider intentProvider) {
    throwExceptionIfOnMainThread();

    // Because expo have ongoing notification we have to change priority in order to show up buttons
    builder.setPriority(Notification.PRIORITY_MAX);

    SharedPreferences sharedPreferences = context.getSharedPreferences(SHARED_PREFERENCES_FILE, Context.MODE_PRIVATE);
    Set<String> actions = sharedPreferences.getStringSet(categoryId, null);

    for(String actionId : actions) {
      ActionObject actionObject = getDb(context).mActionObjectDao().findById(actionId);
      addAction(builder, actionObject, intentProvider, context);
    }
  }

  private static void addAction(NotificationCompat.Builder builder, ActionObject actionObject, IntentProvider intentProvider, Context context) {
    TreeMap<String, String> action = new TreeMap<>();
    Intent intent = intentProvider.provide();

    String actionId = actionObject.getActionId();
    if (actionId.contains(":")) {
      actionId = actionId.split(":")[1];
    }

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

  private static ActionDatabase getDb(Context context) {
    if (db == null) {
      db = Room.databaseBuilder(context, ActionDatabase.class, DATABASE_NAME).build();
    }
    return db;
  }

}
