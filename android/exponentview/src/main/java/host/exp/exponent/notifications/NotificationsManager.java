package host.exp.exponent.notifications;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.support.v4.app.NotificationManagerCompat;

import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.KernelConstants;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import javax.inject.Inject;

import host.exp.exponent.storage.ExponentSharedPreferences;

import java.util.HashMap;

public class NotificationsManager {

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  private Context mContext;

  public NotificationsManager(Context context) {
    mContext = context;
    NativeModuleDepsProvider.getInstance().inject(NotificationsManager.class, this);
  }

  public void notify(String experienceId, int id, Notification notification) {
    NotificationManagerCompat.from(mContext).notify(experienceId, id, notification);

    try {
      JSONObject metadata = mExponentSharedPreferences.getExperienceMetadata(experienceId);
      if (metadata == null) {
        metadata = new JSONObject();
      }

      JSONArray notifications = metadata.optJSONArray(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_NOTIFICATION_IDS);
      if (notifications == null) {
        notifications = new JSONArray();
      }
      notifications.put(id);
      metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_NOTIFICATION_IDS, notifications);
      mExponentSharedPreferences.updateExperienceMetadata(experienceId, metadata);
    } catch (JSONException e) {
      e.printStackTrace();
    }
  }

  public void cancel(String experienceId, int id) {
    NotificationManagerCompat.from(mContext).cancel(experienceId, id);

    try {
      JSONObject metadata = mExponentSharedPreferences.getExperienceMetadata(experienceId);
      if (metadata == null) {
        return;
      }
      JSONArray oldNotifications = metadata.optJSONArray(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_NOTIFICATION_IDS);
      if (oldNotifications == null) {
        return;
      }
      JSONArray newNotifications = new JSONArray();
      for (int i = 0; i < oldNotifications.length(); i++) {
        if (oldNotifications.getInt(i) != id) {
          newNotifications.put(id);
        }
      }
      metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_NOTIFICATION_IDS, newNotifications);
      mExponentSharedPreferences.updateExperienceMetadata(experienceId, metadata);
    } catch (JSONException e) {
      e.printStackTrace();
    }
  }

  public void cancelAll(String experienceId) {
    try {
      JSONObject metadata = mExponentSharedPreferences.getExperienceMetadata(experienceId);
      if (metadata == null) {
        return;
      }
      JSONArray notifications = metadata.optJSONArray(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_NOTIFICATION_IDS);
      if (notifications == null) {
        return;
      }
      NotificationManagerCompat manager = NotificationManagerCompat.from(mContext);
      for (int i = 0; i < notifications.length(); i++) {
        manager.cancel(experienceId, notifications.getInt(i));
      }
      metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_NOTIFICATION_IDS, null);
      mExponentSharedPreferences.updateExperienceMetadata(experienceId, metadata);
    } catch (JSONException e) {
      e.printStackTrace();
    }
  }

  public void schedule(String experienceId, int id, HashMap details, long time, Long interval) throws ClassNotFoundException {
    Class receiverClass = Class.forName(KernelConstants.SCHEDULED_NOTIFICATION_RECEIVER_NAME);
    Intent notificationIntent = new Intent(mContext, receiverClass);

    notificationIntent.setType(experienceId);
    notificationIntent.setAction(String.valueOf(id));

    notificationIntent.putExtra(KernelConstants.NOTIFICATION_ID_KEY, id);
    notificationIntent.putExtra(KernelConstants.NOTIFICATION_OBJECT_KEY, details);

    PendingIntent pendingIntent = PendingIntent.getBroadcast(mContext, 0, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT);

    AlarmManager alarmManager = (AlarmManager) mContext.getSystemService(Context.ALARM_SERVICE);

    if (interval != null) {
      alarmManager.setRepeating(AlarmManager.ELAPSED_REALTIME_WAKEUP, time, interval, pendingIntent);
    } else {
      alarmManager.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, time, pendingIntent);
    }

    try {
      JSONObject metadata = mExponentSharedPreferences.getExperienceMetadata(experienceId);
      if (metadata == null) {
        metadata = new JSONObject();
      }

      JSONArray notifications = metadata.optJSONArray(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_SCHEDULED_NOTIFICATION_IDS);
      if (notifications == null) {
        notifications = new JSONArray();
      }
      notifications.put(id);
      metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_SCHEDULED_NOTIFICATION_IDS, notifications);
      mExponentSharedPreferences.updateExperienceMetadata(experienceId, metadata);
    } catch (JSONException e) {
      e.printStackTrace();
    }
  }

  public void cancelScheduled(String experienceId, int id) throws ClassNotFoundException {
    Class receiverClass = Class.forName(KernelConstants.SCHEDULED_NOTIFICATION_RECEIVER_NAME);
    Intent notificationIntent = new Intent(mContext, receiverClass);

    notificationIntent.setType(experienceId);
    notificationIntent.setAction(String.valueOf(id));

    PendingIntent pendingIntent = PendingIntent.getBroadcast(mContext, 0, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT);
    AlarmManager alarmManager = (AlarmManager) mContext.getSystemService(Context.ALARM_SERVICE);

    alarmManager.cancel(pendingIntent);
    cancel(experienceId, id);
  }

  public void cancelAllScheduled(String experienceId) throws ClassNotFoundException {
    try {
      JSONObject metadata = mExponentSharedPreferences.getExperienceMetadata(experienceId);
      if (metadata == null) {
        return;
      }
      JSONArray notifications = metadata.optJSONArray(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_SCHEDULED_NOTIFICATION_IDS);
      if (notifications == null) {
        return;
      }
      for (int i = 0; i < notifications.length(); i++) {
        cancelScheduled(experienceId, notifications.getInt(i));
      }
      metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_SCHEDULED_NOTIFICATION_IDS, null);
      mExponentSharedPreferences.updateExperienceMetadata(experienceId, metadata);
    } catch (JSONException e) {
      e.printStackTrace();
    }
  }
}
