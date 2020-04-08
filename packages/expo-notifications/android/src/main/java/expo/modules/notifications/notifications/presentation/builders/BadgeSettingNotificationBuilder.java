package expo.modules.notifications.notifications.presentation.builders;

import android.app.Notification;
import android.content.Context;
import android.os.Bundle;

import androidx.core.app.NotificationCompat;
import expo.modules.notifications.notifications.model.NotificationContent;
import me.leolin.shortcutbadger.ShortcutBadger;

public class BadgeSettingNotificationBuilder extends ExpoNotificationBuilder {
  public static final String EXTRAS_BADGE_KEY = "badge";

  public BadgeSettingNotificationBuilder(Context context) {
    super(context);
  }

  @Override
  protected NotificationCompat.Builder createBuilder() {
    NotificationCompat.Builder builder = super.createBuilder();

    if (shouldSetBadge()) {
      // Forward information about badge count to set
      // to SetBadgeCountNotificationEffect.
      Bundle extras = builder.getExtras();
      extras.putInt(EXTRAS_BADGE_KEY, getBadgeCount());
      builder.setExtras(extras);
    }

    return builder;
  }

  @Override
  public Notification build() {
    Notification notification = super.build();

    if (shouldSetBadge()) {
      // Xiaomi devices require this extra notification configuration step
      // https://github.com/leolin310148/ShortcutBadger/wiki/Xiaomi-Device-Support
      // Badge for other devices is set as an effect in SetBadgeCountNotificationEffect
      ShortcutBadger.applyNotification(getContext(), notification, getBadgeCount());
    }

    return notification;
  }

  private boolean shouldSetBadge() {
    boolean behaviorAllowsBadge = getNotificationBehavior() == null || getNotificationBehavior().shouldSetBadge();

    NotificationContent content = getNotificationContent();
    boolean contentDefinesBadge = content.getBadgeCount() != null;

    return behaviorAllowsBadge && contentDefinesBadge;
  }

  private int getBadgeCount() {
    Number badgeCount = getNotificationContent().getBadgeCount();
    if (badgeCount == null) {
      // We should never end up here, since getBadgeCount is guarded by
      // shouldSetBadge, which checks if badgeCount is null, but in case
      // this is ever called, let's not crash the application.
      return 0;
    }
    return badgeCount.intValue();
  }
}
