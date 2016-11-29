package host.exp.exponent.notifications;

import android.app.Notification;
import android.content.Context;
import android.support.v4.app.NotificationManagerCompat;

import host.exp.exponent.di.NativeModuleDepsProvider;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import javax.inject.Inject;

import host.exp.exponent.storage.ExponentSharedPreferences;

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
            for (int i = 0; i < notifications.length(); i++) {
                NotificationManagerCompat.from(mContext).cancel(experienceId, notifications.getInt(i));
            }
            metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_ALL_NOTIFICATION_IDS, null);
            mExponentSharedPreferences.updateExperienceMetadata(experienceId, metadata);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }
}
