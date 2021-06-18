package host.exp.exponent.notifications;

import android.content.Context;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import javax.inject.Inject;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelManager;
import expo.modules.notifications.notifications.interfaces.NotificationBuilder;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.presentation.builders.CategoryAwareNotificationBuilder;
import expo.modules.notifications.service.delegates.SharedPreferencesNotificationCategoriesStore;
import expo.modules.updates.manifest.ManifestFactory;
import expo.modules.updates.manifest.raw.RawManifest;
import host.exp.exponent.Constants;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.notifications.model.ScopedNotificationRequest;
import host.exp.exponent.storage.ExperienceDBObject;
import host.exp.exponent.storage.ExponentDB;
import host.exp.expoview.R;
import versioned.host.exp.exponent.modules.api.notifications.channels.ScopedNotificationsChannelManager;
import versioned.host.exp.exponent.modules.api.notifications.channels.ScopedNotificationsGroupManager;

public class ScopedExpoNotificationBuilder extends CategoryAwareNotificationBuilder {
  @Inject
  ExponentManifest mExponentManifest;
  @Nullable
  RawManifest manifest;

  @Nullable
  ExperienceKey mExperienceKey;

  public ScopedExpoNotificationBuilder(Context context, SharedPreferencesNotificationCategoriesStore store) {
    super(context, store);
    NativeModuleDepsProvider.getInstance().inject(ScopedExpoNotificationBuilder.class, this);
  }

  @Override
  public NotificationBuilder setNotification(expo.modules.notifications.notifications.model.Notification notification) {
    super.setNotification(notification);

    // We parse manifest here to have easy access to it from other methods.
    NotificationRequest requester = getNotification().getNotificationRequest();
    if (requester instanceof ScopedNotificationRequest) {
      String experienceScopeKey = ((ScopedNotificationRequest) requester).getExperienceScopeKeyString();
      ExperienceDBObject experience = ExponentDB.experienceScopeKeyToExperienceSync(experienceScopeKey);
      try {
        manifest = ManifestFactory.INSTANCE.getRawManifestFromJson(new JSONObject(experience.manifest));
        mExperienceKey = ExperienceKey.fromRawManifest(manifest);
      } catch (JSONException e) {
        Log.e("notifications", "Couldn't parse manifest.", e);
        e.printStackTrace();
      }
    }

    return this;
  }

  @NonNull
  @Override
  protected NotificationsChannelManager getNotificationsChannelManager() {
    if (mExperienceKey == null) {
      return super.getNotificationsChannelManager();
    }

    return new ScopedNotificationsChannelManager(getContext(), mExperienceKey, new ScopedNotificationsGroupManager(getContext(), mExperienceKey));
  }

  @Override
  protected int getIcon() {
    return Constants.isStandaloneApp() ? R.drawable.shell_notification_icon : R.drawable.notification_icon;
  }

  @Nullable
  @Override
  protected Number getColor() {
    // Try to use color defined in notification content
    if (getNotificationContent().getColor() != null) {
      return getNotificationContent().getColor();
    }

    if (manifest == null) {
      return super.getColor();
    }

    return NotificationHelper.getColor(null, manifest, mExponentManifest);
  }
}
