// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.gcm;

import android.app.Notification;
import android.app.PendingIntent;
import android.content.Intent;
import android.graphics.Bitmap;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Bundle;
import android.support.v4.app.NotificationCompat;
import android.support.v4.app.NotificationManagerCompat;

import com.google.android.gms.gcm.GcmListenerService;

import host.exp.exponent.notifications.*;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Random;

import javax.inject.Inject;

import de.greenrobot.event.EventBus;
import host.exp.exponent.Constants;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.LauncherActivity;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.storage.ExperienceDBObject;
import host.exp.exponent.storage.ExponentDB;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponentview.R;

public class ExponentGcmListenerService extends GcmListenerService {

  private static final String TAG = ExponentGcmListenerService.class.getSimpleName();

  private static ExponentGcmListenerService sInstance;
  public static ExponentGcmListenerService getInstance() {
    return sInstance;
  }

  private enum Mode {
    DEFAULT,
    COLLAPSE
  }

  @Inject
  ExponentManifest mExponentManifest;

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Override
  public void onCreate() {
    super.onCreate();
    NativeModuleDepsProvider.getInstance().inject(ExponentGcmListenerService.class, this);

    sInstance = this;
  }

  @Override
  public void onMessageReceived(String from, Bundle bundle) {
    final String body = bundle.getString("body");

    final String experienceId = bundle.getString("experienceId");
    if (experienceId == null) {
      EXL.e(TAG, "No experienceId in push payload.");
      return;
    }

    final String message = bundle.getString("message");
    if (message == null) {
      EXL.e(TAG, "No message in push payload.");
      return;
    }

    ExponentDB.experienceIdToExperience(experienceId, new ExponentDB.ExperienceResultListener() {
      @Override
      public void onSuccess(ExperienceDBObject experience) {
        try {
          JSONObject manifest = new JSONObject(experience.manifest);
          sendNotification(message, experienceId, experience.manifestUrl, manifest, body);
        } catch (JSONException e) {
          EXL.e(TAG, "Couldn't deserialize JSON for experience id " + experienceId);
        }
      }

      @Override
      public void onFailure() {
        EXL.e(TAG, "No experience found for id " + experienceId);
      }
    });
  }

  private void sendNotification(final String message, final String experienceId, final String manifestUrl,
                                final JSONObject manifest, final String body) {
    final String name = manifest.optString(ExponentManifest.MANIFEST_NAME_KEY);
    if (name == null) {
      EXL.e(TAG, "No name found for experience id " + experienceId);
      return;
    }

    final JSONObject notificationPreferences = manifest.optJSONObject(ExponentManifest.MANIFEST_NOTIFICATION_INFO_KEY);

    NotificationHelper.loadIcon(null, manifest, mExponentManifest, new ExponentManifest.BitmapListener() {
      @Override
      public void onLoadBitmap(Bitmap bitmap) {
        Mode mode = Mode.DEFAULT;
        String collapsedTitle = null;
        JSONArray unreadNotifications = new JSONArray();

        // Modes
        if (notificationPreferences != null) {
          String modeString = notificationPreferences.optString(ExponentManifest.MANIFEST_NOTIFICATION_ANDROID_MODE);
          if (NotificationConstants.NOTIFICATION_COLLAPSE_MODE.equals(modeString)) {
            mode = Mode.COLLAPSE;
          }
        }

        // Update metadata
        int notificationId = mode == Mode.COLLAPSE ? experienceId.hashCode() : new Random().nextInt();
        addUnreadNotificationToMetadata(experienceId, message, notificationId);

        // Collapse mode fields
        if (mode == Mode.COLLAPSE) {
          unreadNotifications = getUnreadNotificationsFromMetadata(experienceId);

          String collapsedTitleRaw = notificationPreferences.optString(ExponentManifest.MANIFEST_NOTIFICATION_ANDROID_COLLAPSED_TITLE);
          if (collapsedTitleRaw != null) {
            collapsedTitle = collapsedTitleRaw.replace(NotificationConstants.NOTIFICATION_UNREAD_COUNT_KEY, "" + unreadNotifications.length());
          }
        }

        int color = NotificationHelper.getColor(null, manifest, mExponentManifest);

        // Create notification object
        boolean isMultiple = mode == Mode.COLLAPSE && unreadNotifications.length() > 1;
        ReceivedNotificationEvent notificationEvent = new ReceivedNotificationEvent(experienceId, body, notificationId, isMultiple, true);

        // Create pending intent
        Intent intent = new Intent(ExponentGcmListenerService.this, LauncherActivity.class);
        intent.putExtra(KernelConstants.NOTIFICATION_MANIFEST_URL_KEY, manifestUrl);
        intent.putExtra(KernelConstants.NOTIFICATION_KEY, body); // deprecated
        intent.putExtra(KernelConstants.NOTIFICATION_OBJECT_KEY, notificationEvent.toJSONObject(null).toString());
        PendingIntent pendingIntent = PendingIntent.getActivity(ExponentGcmListenerService.this, 0, intent,
            PendingIntent.FLAG_ONE_SHOT);

        // Build notification
        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        NotificationCompat.Builder notificationBuilder;

        if (isMultiple) {
          NotificationCompat.InboxStyle style = new NotificationCompat.InboxStyle()
              .setBigContentTitle(collapsedTitle);

          for (int i = 0; i < Math.min(unreadNotifications.length(), NotificationConstants.MAX_COLLAPSED_NOTIFICATIONS); i++) {
            try {
              JSONObject unreadNotification = (JSONObject) unreadNotifications.get(i);
              style.addLine(unreadNotification.getString(NotificationConstants.NOTIFICATION_MESSAGE_KEY));
            } catch (JSONException e) {
              e.printStackTrace();
            }
          }

          if (unreadNotifications.length() > NotificationConstants.MAX_COLLAPSED_NOTIFICATIONS) {
            style.addLine("and " + (unreadNotifications.length() - NotificationConstants.MAX_COLLAPSED_NOTIFICATIONS) + " more...");
          }

          notificationBuilder = new NotificationCompat.Builder(ExponentGcmListenerService.this)
              .setSmallIcon(R.drawable.notification_icon)
              .setContentTitle(collapsedTitle)
              .setColor(color)
              .setContentText(name)
              .setAutoCancel(true)
              .setSound(defaultSoundUri)
              .setContentIntent(pendingIntent)
              .setStyle(style);
        } else {
          notificationBuilder = new NotificationCompat.Builder(ExponentGcmListenerService.this)
              .setSmallIcon(R.drawable.notification_icon)
              .setContentTitle(name)
              .setColor(color)
              .setContentText(message)
              .setAutoCancel(true)
              .setSound(defaultSoundUri)
              .setContentIntent(pendingIntent);
        }

        // Add icon
        Notification notification;
        if (!manifestUrl.equals(Constants.INITIAL_URL)) {
          notification = notificationBuilder.setLargeIcon(bitmap).build();
        } else {
          // TODO: don't actually need to load bitmap in this case
          notification = notificationBuilder.setSmallIcon(R.drawable.shell_notification_icon).build();
        }

        // Display
        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(ExponentGcmListenerService.this);
        notificationManager.notify(experienceId, notificationId, notification);

        // Send event. Will be consumed if experience is already open.
        EventBus.getDefault().post(notificationEvent);
      }
    });
  }

  private void addUnreadNotificationToMetadata(String experienceId, String message, int notificationId) {
    try {
      JSONObject notification = new JSONObject();
      notification.put(NotificationConstants.NOTIFICATION_MESSAGE_KEY, message);
      notification.put(NotificationConstants.NOTIFICATION_ID_KEY, notificationId);

      JSONObject metadata = mExponentSharedPreferences.getExperienceMetadata(experienceId);
      if (metadata == null) {
        metadata = new JSONObject();
      }

      JSONArray unreadNotifications = metadata.optJSONArray(ExponentSharedPreferences.EXPERIENCE_METADATA_UNREAD_NOTIFICATIONS);
      if (unreadNotifications == null) {
        unreadNotifications = new JSONArray();
      }

      unreadNotifications.put(notification);

      metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_UNREAD_NOTIFICATIONS, unreadNotifications);
      mExponentSharedPreferences.updateExperienceMetadata(experienceId, metadata);
    } catch (JSONException e) {
      e.printStackTrace();
    }
  }

  private JSONArray getUnreadNotificationsFromMetadata(String experienceId) {
    JSONObject metadata = mExponentSharedPreferences.getExperienceMetadata(experienceId);
    if (metadata != null) {
      if (metadata.has(ExponentSharedPreferences.EXPERIENCE_METADATA_UNREAD_NOTIFICATIONS)) {
        try {
          return metadata.getJSONArray(ExponentSharedPreferences.EXPERIENCE_METADATA_UNREAD_NOTIFICATIONS);
        } catch (JSONException e) {
          e.printStackTrace();
        }
      }
    }

    return new JSONArray();
  }

  public void removeNotifications(JSONArray unreadNotifications) {
    if (unreadNotifications == null) {
      return;
    }

    NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this);
    for (int i = 0; i < unreadNotifications.length(); i++) {
      try {
        notificationManager.cancel(Integer.parseInt(((JSONObject) unreadNotifications.get(i)).getString(NotificationConstants.NOTIFICATION_ID_KEY)));
      } catch (JSONException e) {
        e.printStackTrace();
      }
    }
  }
}
