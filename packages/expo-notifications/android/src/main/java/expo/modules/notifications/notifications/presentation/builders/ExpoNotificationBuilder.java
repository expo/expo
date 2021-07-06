package expo.modules.notifications.notifications.presentation.builders;

import android.app.Notification;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.Bundle;
import android.os.Parcel;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import expo.modules.notifications.notifications.enums.NotificationPriority;
import expo.modules.notifications.notifications.interfaces.NotificationBuilder;
import expo.modules.notifications.notifications.model.NotificationAction;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.service.NotificationsService;

import static expo.modules.notifications.notifications.model.NotificationResponse.DEFAULT_ACTION_IDENTIFIER;

/**
 * {@link NotificationBuilder} interpreting a JSON request object.
 */
public class ExpoNotificationBuilder extends ChannelAwareNotificationBuilder {
  public static final String META_DATA_DEFAULT_ICON_KEY = "expo.modules.notifications.default_notification_icon";
  public static final String META_DATA_LARGE_ICON_KEY = "expo.modules.notifications.large_notification_icon";
  public static final String META_DATA_DEFAULT_COLOR_KEY = "expo.modules.notifications.default_notification_color";
  public static final String EXTRAS_MARSHALLED_NOTIFICATION_REQUEST_KEY = "expo.notification_request";
  private static final String EXTRAS_BODY_KEY = "body";

  private static final long[] NO_VIBRATE_PATTERN = new long[]{0, 0};

  public ExpoNotificationBuilder(Context context) {
    super(context);
  }

  protected NotificationCompat.Builder createBuilder() {
    NotificationCompat.Builder builder = super.createBuilder();
    builder.setSmallIcon(getIcon());
    builder.setLargeIcon(getLargeIcon());
    builder.setPriority(getPriority());

    NotificationContent content = getNotificationContent();

    builder.setAutoCancel(content.isAutoDismiss());
    builder.setOngoing(content.isSticky());

    builder.setContentTitle(content.getTitle());
    builder.setContentText(content.getText());
    builder.setSubText(content.getSubtitle());
    // Sets the text/contentText as the bigText to allow the notification to be expanded and the
    // entire text to be viewed.
    builder.setStyle(new NotificationCompat.BigTextStyle().bigText(content.getText()));

    Number notificationColor = getColor();
    if (notificationColor != null) {
      builder.setColor(notificationColor.intValue());
    }

    boolean shouldPlayDefaultSound = shouldPlaySound() && content.shouldPlayDefaultSound();
    if (shouldPlayDefaultSound && shouldVibrate()) {
      builder.setDefaults(NotificationCompat.DEFAULT_ALL); // set sound, vibration and lights
    } else if (shouldVibrate()) {
      builder.setDefaults(NotificationCompat.DEFAULT_VIBRATE);
    } else if (shouldPlayDefaultSound) {
      builder.setDefaults(NotificationCompat.DEFAULT_SOUND);
    } else {
      // Notification will not vibrate or play sound, regardless of channel
      builder.setSilent(true);
    }

    if (shouldPlaySound() && content.getSound() != null) {
      builder.setSound(content.getSound());
    } else if (shouldPlayDefaultSound) {
      builder.setSound(Settings.System.DEFAULT_NOTIFICATION_URI);
    }

    long[] vibrationPatternOverride = content.getVibrationPattern();
    if (shouldVibrate() && vibrationPatternOverride != null) {
      builder.setVibrate(vibrationPatternOverride);
    }

    if (content.getBody() != null) {
      // Add body - JSON data - to extras
      Bundle extras = builder.getExtras();
      extras.putString(EXTRAS_BODY_KEY, content.getBody().toString());
      builder.setExtras(extras);
    }

    // Save the notification request in extras for later usage
    // eg. in ExpoPresentationDelegate when we fetch active notifications.
    // Otherwise we'd have to create expo.Notification from android.Notification
    // and deal with two-way interpreting.
    Bundle requestExtras = new Bundle();
    // Class loader used in BaseBundle when unmarshalling notification extras
    // cannot handle expo.modules.notifications.….NotificationRequest
    // so we go around it by marshalling and unmarshalling the object ourselves.
    requestExtras.putByteArray(EXTRAS_MARSHALLED_NOTIFICATION_REQUEST_KEY, marshallNotificationRequest(getNotification().getNotificationRequest()));
    builder.addExtras(requestExtras);

    NotificationAction defaultAction = new NotificationAction(DEFAULT_ACTION_IDENTIFIER, null, true);
    builder.setContentIntent(NotificationsService.Companion.createNotificationResponseIntent(getContext(), getNotification(), defaultAction));

    return builder;
  }

  @Override
  public Notification build() {
    return createBuilder().build();
  }

  /**
   * Marshalls {@link NotificationRequest} into to a byte array.
   *
   * @param request Notification request to marshall
   * @return Given request marshalled to a byte array or null if the process failed.
   */
  @Nullable
  protected byte[] marshallNotificationRequest(NotificationRequest request) {
    try {
      Parcel parcel = Parcel.obtain();
      request.writeToParcel(parcel, 0);
      byte[] bytes = parcel.marshall();
      parcel.recycle();
      return bytes;
    } catch (Exception e) {
      // If we couldn't marshall the request, let's not fail the whole build process.
      // The request is only used to extract source request when fetching displayed notifications.
      Log.e("expo-notifications", String.format("Could not marshalled notification request: %s.", request.getIdentifier()));
      e.printStackTrace();
      return null;
    }
  }

  /**
   * Notification should play a sound if and only if:
   * - behavior is not set or allows sound AND
   * - notification request doesn't explicitly set "sound" to false.
   * <p>
   * This way a notification can set "sound" to false to disable sound,
   * and we always honor the allowedBehavior, if set.
   *
   * @return Whether the notification should play a sound.
   */
  private boolean shouldPlaySound() {
    boolean behaviorAllowsSound = getNotificationBehavior() == null || getNotificationBehavior().shouldPlaySound();

    NotificationContent content = getNotificationContent();
    boolean contentAllowsSound = content.shouldPlayDefaultSound() || content.getSound() != null;

    return behaviorAllowsSound && contentAllowsSound;
  }

  /**
   * Notification should vibrate if and only if:
   * - behavior is not set or allows sound AND
   * - notification request doesn't explicitly set "vibrate" to false.
   * <p>
   * This way a notification can set "vibrate" to false to disable vibration.
   *
   * @return Whether the notification should vibrate.
   */
  private boolean shouldVibrate() {
    boolean behaviorAllowsVibration = getNotificationBehavior() == null || getNotificationBehavior().shouldPlaySound();

    NotificationContent content = getNotificationContent();
    boolean contentAllowsVibration = content.shouldUseDefaultVibrationPattern() || content.getVibrationPattern() != null;

    return behaviorAllowsVibration && contentAllowsVibration;
  }

  /**
   * When setting the priority we want to honor both behavior set by the current
   * notification handler and the preset priority (in that order of significance).
   * <p>
   * We do this by returning:
   * - if behavior defines a priority: the priority,
   * - if the notification should be shown: high priority (or max, if requested in the notification),
   * - if the notification should not be shown: default priority (or lower, if requested in the notification).
   * <p>
   * This way we allow full customization to the developers.
   *
   * @return Priority of the notification, one of NotificationCompat.PRIORITY_*
   */
  private int getPriority() {
    NotificationPriority requestPriority = getNotificationContent().getPriority();

    // If we know of a behavior guideline, let's honor it...
    if (getNotificationBehavior() != null) {
      // ...by using the priority override...
      NotificationPriority priorityOverride = getNotificationBehavior().getPriorityOverride();
      if (priorityOverride != null) {
        return priorityOverride.getNativeValue();
      }

      // ...or by setting min/max values for priority:
      // If the notification has no priority set, let's pick a neutral value and depend solely on the behavior.
      int requestPriorityValue =
        requestPriority != null
          ? requestPriority.getNativeValue()
          : NotificationPriority.DEFAULT.getNativeValue();

      // TODO (barthap): This is going to be a dead code upon removing presentNotificationAsync()
      // shouldShowAlert() will always be false here.
      if (getNotificationBehavior().shouldShowAlert()) {
        // Display as a heads-up notification, as per the behavior
        // while also allowing making the priority higher.
        return Math.max(NotificationCompat.PRIORITY_HIGH, requestPriorityValue);
      } else {
        // Do not display as a heads-up notification, but show in the notification tray
        // as per the behavior, while also allowing making the priority lower.
        return Math.min(NotificationCompat.PRIORITY_DEFAULT, requestPriorityValue);
      }
    }

    // No behavior is set, the only source of priority can be the request.
    if (requestPriority != null) {
      return requestPriority.getNativeValue();
    }

    // By default let's show the notification
    return NotificationCompat.PRIORITY_HIGH;
  }

  /**
   * The method first tries to get the large icon from the manifest's meta-data {@link #META_DATA_DEFAULT_ICON_KEY}.
   * If a custom setting is not found, the method falls back to null.
   *
   * @return Bitmap containing larger icon or null if a custom settings was not provided.
   */
  @Nullable
  protected Bitmap getLargeIcon() {
    try {
      ApplicationInfo ai = getContext().getPackageManager().getApplicationInfo(getContext().getPackageName(), PackageManager.GET_META_DATA);
      if (ai.metaData.containsKey(META_DATA_LARGE_ICON_KEY)) {
        int resourceId = ai.metaData.getInt(META_DATA_LARGE_ICON_KEY);
        return BitmapFactory.decodeResource(getContext().getResources(), resourceId);
      }
    } catch (PackageManager.NameNotFoundException | ClassCastException e) {
      Log.e("expo-notifications", "Could not have fetched large notification icon.");
    }
    return null;
  }

  /**
   * The method first tries to get the icon from the manifest's meta-data {@link #META_DATA_DEFAULT_ICON_KEY}.
   * If a custom setting is not found, the method falls back to using app icon.
   *
   * @return Resource ID for icon that should be used as a notification icon.
   */
  protected int getIcon() {
    try {
      ApplicationInfo ai = getContext().getPackageManager().getApplicationInfo(getContext().getPackageName(), PackageManager.GET_META_DATA);
      if (ai.metaData.containsKey(META_DATA_DEFAULT_ICON_KEY)) {
        return ai.metaData.getInt(META_DATA_DEFAULT_ICON_KEY);
      }
    } catch (PackageManager.NameNotFoundException | ClassCastException e) {
      Log.e("expo-notifications", "Could not have fetched default notification icon.");
    }
    return getContext().getApplicationInfo().icon;
  }

  /**
   * The method responsible for finding and returning a custom color used to color the notification icon.
   * It first tries to use a custom color defined in notification content, then it tries to fetch color
   * from resources (based on manifest's meta-data). If not found, returns null.
   *
   * @return A {@link Number}, if a custom color should be used for notification icon
   * or null if the default should be used.
   */
  @Nullable
  protected Number getColor() {
    if (getNotificationContent().getColor() != null) {
      return getNotificationContent().getColor();
    }

    try {
      ApplicationInfo ai = getContext().getPackageManager().getApplicationInfo(getContext().getPackageName(), PackageManager.GET_META_DATA);
      if (ai.metaData.containsKey(META_DATA_DEFAULT_COLOR_KEY)) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          return getContext().getResources().getColor(ai.metaData.getInt(META_DATA_DEFAULT_COLOR_KEY), null);
        } else {
          return getContext().getResources().getColor(ai.metaData.getInt(META_DATA_DEFAULT_COLOR_KEY));
        }
      }
    } catch (PackageManager.NameNotFoundException | Resources.NotFoundException | ClassCastException e) {
      Log.e("expo-notifications", "Could not have fetched default notification color.");
    }

    // No custom color
    return null;
  }
}
