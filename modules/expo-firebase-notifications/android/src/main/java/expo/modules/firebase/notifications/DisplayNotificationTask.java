package expo.modules.firebase.notifications;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.support.v4.app.NotificationCompat;
import android.support.v4.app.RemoteInput;
import android.util.Log;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.modules.firebase.app.Utils;

public class DisplayNotificationTask extends AsyncTask<Void, Void, Void> {
  private static final String TAG = "DisplayNotificationTask";

  private final Context context;
  private final Bundle notification;
  private final NotificationManager notificationManager;
  private final Promise promise;
  private ModuleRegistry mModuleRegistry;

  public DisplayNotificationTask(
    Context context, ModuleRegistry mModuleRegistry,
    NotificationManager notificationManager,
    Bundle notification, Promise promise
  ) {
    this.context = context;
    this.notification = notification;
    this.notificationManager = notificationManager;
    this.promise = promise;
    this.mModuleRegistry = mModuleRegistry;
  }

  @Override
  protected Void doInBackground(Void... voids) {
    try {
      Class intentClass = getMainActivityClass();
      if (intentClass == null) {
        if (promise != null) {
          promise.reject(
            "notification/display_notification_error",
            "Could not find main activity class"
          );
        }
        return null;
      }

      Bundle android = notification.getBundle("android");

      String channelId = android.getString("channelId");
      String notificationId = notification.getString("notificationId");

      NotificationCompat.Builder nb;
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        nb = new NotificationCompat.Builder(context, channelId);
      } else {
        nb = new NotificationCompat.Builder(context);
      }

      if (notification.containsKey("body")) {
        nb = nb.setContentText(notification.getString("body"));
      }
      if (notification.containsKey("data")) {
        nb = nb.setExtras(notification.getBundle("data"));
      }
      if (notification.containsKey("sound")) {
        Uri sound = FirebaseNotificationManager.getSound(
          context,
          notification.getString("sound")
        );
        nb = nb.setSound(sound);
      }
      if (notification.containsKey("subtitle")) {
        nb = nb.setSubText(notification.getString("subtitle"));
      }
      if (notification.containsKey("title")) {
        nb = nb.setContentTitle(notification.getString("title"));
      }

      if (android.containsKey("autoCancel")) {
        nb = nb.setAutoCancel(android.getBoolean("autoCancel"));
      }
      if (android.containsKey("badgeIconType")) {
        Double badgeIconType = android.getDouble("badgeIconType");
        nb = nb.setBadgeIconType(badgeIconType.intValue());
      }
      if (android.containsKey("bigPicture")) {
        Bundle bigPicture = android.getBundle("bigPicture");

        NotificationCompat.BigPictureStyle bp = new NotificationCompat.BigPictureStyle();
        Bitmap picture = getBitmap(bigPicture.getString("picture"));
        if (picture != null) {
          bp = bp.bigPicture(picture);
        }
        if (bigPicture.containsKey("largeIcon")) {
          Bitmap largeIcon = getBitmap(bigPicture.getString("largeIcon"));
          if (largeIcon != null) {
            bp = bp.bigLargeIcon(largeIcon);
          }
        }
        if (bigPicture.containsKey("contentTitle")) {
          bp = bp.setBigContentTitle(bigPicture.getString("contentTitle"));
        }
        if (bigPicture.containsKey("summaryText")) {
          bp = bp.setSummaryText(bigPicture.getString("summaryText"));
        }
        nb = nb.setStyle(bp);
      }
      if (android.containsKey("bigText")) {
        Bundle bigText = android.getBundle("bigText");

        NotificationCompat.BigTextStyle bt = new NotificationCompat.BigTextStyle();
        bt.bigText(bigText.getString("text"));
        if (bigText.containsKey("contentTitle")) {
          bt = bt.setBigContentTitle(bigText.getString("contentTitle"));
        }
        if (bigText.containsKey("summaryText")) {
          bt = bt.setSummaryText(bigText.getString("summaryText"));
        }
        nb = nb.setStyle(bt);
      }
      if (android.containsKey("category")) {
        nb = nb.setCategory(android.getString("category"));
      }
      if (android.containsKey("color")) {
        String color = android.getString("color");
        nb = nb.setColor(Color.parseColor(color));
      }
      if (android.containsKey("colorized")) {
        nb = nb.setColorized(android.getBoolean("colorized"));
      }
      if (android.containsKey("contentInfo")) {
        nb = nb.setContentInfo(android.getString("contentInfo"));
      }
      if (android.containsKey("defaults")) {
        Double defaultValues = android.getDouble("defaults");
        int defaults = defaultValues.intValue();

        if (defaults == 0) {
          ArrayList<Integer> defaultsArray = android.getIntegerArrayList("defaults");
          if (defaultsArray != null) {
            for (Integer defaultValue : defaultsArray) {
              defaults |= defaultValue;
            }
          }
        }

        nb = nb.setDefaults(defaults);
      }
      if (android.containsKey("group")) {
        nb = nb.setGroup(android.getString("group"));
      }
      if (android.containsKey("groupAlertBehaviour")) {
        Double groupAlertBehaviour = android.getDouble("groupAlertBehaviour");
        nb = nb.setGroupAlertBehavior(groupAlertBehaviour.intValue());
      }
      if (android.containsKey("groupSummary")) {
        nb = nb.setGroupSummary(android.getBoolean("groupSummary"));
      }
      if (android.containsKey("largeIcon")) {
        Bitmap largeIcon = getBitmap(android.getString("largeIcon"));
        if (largeIcon != null) {
          nb = nb.setLargeIcon(largeIcon);
        }
      }
      if (android.containsKey("lights")) {
        Bundle lights = android.getBundle("lights");
        Double argb = lights.getDouble("argb");
        Double onMs = lights.getDouble("onMs");
        Double offMs = lights.getDouble("offMs");
        nb = nb.setLights(argb.intValue(), onMs.intValue(), offMs.intValue());
      }
      if (android.containsKey("localOnly")) {
        nb = nb.setLocalOnly(android.getBoolean("localOnly"));
      }

      if (android.containsKey("number")) {
        Double number = android.getDouble("number");
        nb = nb.setNumber(number.intValue());
      }
      if (android.containsKey("ongoing")) {
        nb = nb.setOngoing(android.getBoolean("ongoing"));
      }
      if (android.containsKey("onlyAlertOnce")) {
        nb = nb.setOnlyAlertOnce(android.getBoolean("onlyAlertOnce"));
      }
      if (android.containsKey("people")) {
        List<String> people = android.getStringArrayList("people");
        if (people != null) {
          for (String person : people) {
            nb = nb.addPerson(person);
          }
        }
      }
      if (android.containsKey("priority")) {
        Double priority = android.getDouble("priority");
        nb = nb.setPriority(priority.intValue());
      }
      if (android.containsKey("progress")) {
        Bundle progress = android.getBundle("progress");
        Double max = progress.getDouble("max");
        Double progressI = progress.getDouble("progress");
        nb = nb.setProgress(
          max.intValue(),
          progressI.intValue(),
          progress.getBoolean("indeterminate")
        );
      }
      // TODO: Public version of notification
      /* if (android.containsKey("publicVersion")) {
        nb = nb.setPublicVersion();
      } */
      if (android.containsKey("remoteInputHistory")) {
        nb = nb.setRemoteInputHistory(android.getStringArray("remoteInputHistory"));
      }
      if (android.containsKey("shortcutId")) {
        nb = nb.setShortcutId(android.getString("shortcutId"));
      }
      if (android.containsKey("showWhen")) {
        nb = nb.setShowWhen(android.getBoolean("showWhen"));
      }
      if (android.containsKey("smallIcon")) {
        Bundle smallIcon = android.getBundle("smallIcon");
        int smallIconResourceId = getIcon(smallIcon.getString("icon"));

        if (smallIconResourceId != 0) {
          if (smallIcon.containsKey("level")) {
            Double level = smallIcon.getDouble("level");
            nb = nb.setSmallIcon(smallIconResourceId, level.intValue());
          } else {
            nb = nb.setSmallIcon(smallIconResourceId);
          }
        }
      }
      if (android.containsKey("sortKey")) {
        nb = nb.setSortKey(android.getString("sortKey"));
      }
      if (android.containsKey("ticker")) {
        nb = nb.setTicker(android.getString("ticker"));
      }
      if (android.containsKey("timeoutAfter")) {
        Double timeoutAfter = android.getDouble("timeoutAfter");
        nb = nb.setTimeoutAfter(timeoutAfter.longValue());
      }
      if (android.containsKey("usesChronometer")) {
        nb = nb.setUsesChronometer(android.getBoolean("usesChronometer"));
      }
      if (android.containsKey("vibrate")) {
        ArrayList<Integer> vibrate = android.getIntegerArrayList("vibrate");
        if (vibrate != null) {
          long[] vibrateArray = new long[vibrate.size()];
          for (int i = 0; i < vibrate.size(); i++) {
            vibrateArray[i] = vibrate
              .get(i)
              .longValue();
          }
          nb = nb.setVibrate(vibrateArray);
        }
      }
      if (android.containsKey("visibility")) {
        Double visibility = android.getDouble("visibility");
        nb = nb.setVisibility(visibility.intValue());
      }
      if (android.containsKey("when")) {
        Double when = android.getDouble("when");
        nb = nb.setWhen(when.longValue());
      }

      // Build any actions
      if (android.containsKey("actions")) {
        List<Bundle> actions = (List) android.getSerializable("actions");
        for (Bundle a : actions) {
          NotificationCompat.Action action = createAction(a, intentClass, notification);
          nb = nb.addAction(action);
        }
      }

      String tag = null;
      if (android.containsKey("tag")) {
        tag = android.getString("tag");
      }

      // Create the notification intent
      PendingIntent contentIntent = createIntent(
        intentClass,
        notification,
        android.getString("clickAction")
      );
      nb = nb.setContentIntent(contentIntent);

      // Build the notification and send it
      Notification builtNotification = nb.build();
      notificationManager.notify(tag, notificationId.hashCode(), builtNotification);

      if (mModuleRegistry != null) {
        Utils.sendEvent(
            mModuleRegistry,
          "notifications_notification_displayed",
          notification
        );
      }

      if (promise != null) {
        promise.resolve(null);
      }

    } catch (Exception e) {
      Log.e(TAG, "Failed to send notification", e);
      if (promise != null) {
        promise.reject("notification/display_notification_error", "Could not send notification", e);
      }
    }

    return null;
  }

  private NotificationCompat.Action createAction(
    Bundle action,
    Class intentClass,
    Bundle notification
  ) {
    boolean showUserInterface = action.containsKey("showUserInterface") && action.getBoolean(
      "showUserInterface");
    String actionKey = action.getString("action");
    PendingIntent actionIntent = showUserInterface ?
      createIntent(intentClass, notification, actionKey) :
      createBroadcastIntent(notification, actionKey);
    int icon = getIcon(action.getString("icon"));
    String title = action.getString("title");

    NotificationCompat.Action.Builder ab = new NotificationCompat.Action.Builder(
      icon,
      title,
      actionIntent
    );

    if (action.containsKey("allowGeneratedReplies")) {
      ab = ab.setAllowGeneratedReplies(action.getBoolean("allowGeneratedReplies"));
    }
    if (action.containsKey("remoteInputs")) {
      List<Bundle> remoteInputs = (List) action.getSerializable("remoteInputs");
      for (Bundle ri : remoteInputs) {
        RemoteInput remoteInput = createRemoteInput(ri);
        ab = ab.addRemoteInput(remoteInput);
      }
    }
    // TODO: SemanticAction and ShowsUserInterface only available on v28?
    // if (action.containsKey("semanticAction")) {
    //   Double semanticAction = action.getDouble("semanticAction");
    //   ab = ab.setSemanticAction(semanticAction.intValue());
    // }
    // if (action.containsKey("showsUserInterface")) {
    //   ab = ab.setShowsUserInterface(action.getBoolean("showsUserInterface"));
    // }

    return ab.build();
  }

  private PendingIntent createIntent(Class intentClass, Bundle notification, String action) {
    Intent intent = new Intent(context, intentClass);
    intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
    intent.putExtras(notification);

    if (action != null) {
      intent.setAction(action);
    }

    String notificationId = notification.getString("notificationId");
    return PendingIntent.getActivity(
      context,
      notificationId.hashCode(),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT
    );
  }

  private PendingIntent createBroadcastIntent(Bundle notification, String action) {
    Intent intent = new Intent(context, FirebaseBackgroundNotificationActionReceiver.class);
    intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);

    String notificationId = notification.getString("notificationId") + action;

    intent.setAction("io.invertase.firebase.notifications.BackgroundAction");
    intent.putExtra("action", action);
    intent.putExtra("notification", notification);
    return PendingIntent.getBroadcast(
      context,
      notificationId.hashCode(),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT
    );
  }

  private RemoteInput createRemoteInput(Bundle remoteInput) {
    String resultKey = remoteInput.getString("resultKey");

    RemoteInput.Builder rb = new RemoteInput.Builder(resultKey);

    if (remoteInput.containsKey("allowedDataTypes")) {
      List<Bundle> allowedDataTypes = (List) remoteInput.getSerializable("allowedDataTypes");
      for (Bundle adt : allowedDataTypes) {
        rb.setAllowDataType(adt.getString("mimeType"), adt.getBoolean("allow"));
      }
    }
    if (remoteInput.containsKey("allowFreeFormInput")) {
      rb.setAllowFreeFormInput(remoteInput.getBoolean("allowFreeFormInput"));
    }
    if (remoteInput.containsKey("choices")) {
      List<String> choices = remoteInput.getStringArrayList("choices");
      rb.setChoices(choices.toArray(new String[choices.size()]));
    }
    if (remoteInput.containsKey("label")) {
      rb.setLabel(remoteInput.getString("label"));
    }

    return rb.build();
  }

  private Bitmap getBitmap(String image) {
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return getBitmapFromUrl(image);
    } else if (image.startsWith("file://")) {
      return BitmapFactory.decodeFile(image.replace("file://", ""));
    } else {
      int largeIconResId = getIcon(image);
      return BitmapFactory.decodeResource(context.getResources(), largeIconResId);
    }
  }

  private Bitmap getBitmapFromUrl(String imageUrl) {
    try {
      HttpURLConnection connection = (HttpURLConnection) new URL(imageUrl).openConnection();
      connection.setDoInput(true);
      connection.connect();
      return BitmapFactory.decodeStream(connection.getInputStream());
    } catch (IOException e) {
      Log.e(TAG, "Failed to get bitmap for url: " + imageUrl, e);
      return null;
    }
  }

  private int getIcon(String icon) {
    int resourceId = FirebaseNotificationManager.getResourceId(context, "mipmap", icon);
    if (resourceId == 0) {
      resourceId = FirebaseNotificationManager.getResourceId(context, "drawable", icon);
    }
    return resourceId;
  }

  private Class getMainActivityClass() {
    String packageName = context.getPackageName();
    Intent launchIntent = context
      .getPackageManager()
      .getLaunchIntentForPackage(packageName);
    try {
      return Class.forName(launchIntent
                             .getComponent()
                             .getClassName());
    } catch (ClassNotFoundException e) {
      Log.e(TAG, "Failed to get main activity class", e);
      return null;
    }
  }
}
