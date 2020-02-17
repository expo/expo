package expo.modules.notifications.notifications.presentation.builders;

import android.app.Notification;
import android.content.Context;
import android.os.Bundle;

import androidx.core.app.NotificationCompat;
import me.leolin.shortcutbadger.ShortcutBadger;

public class BadgeSettingNotificationBuilder extends ExpoNotificationBuilder {
  private static final String BADGE_KEY = "badge";

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
    return getNotificationRequest().has(BADGE_KEY);
  }

  private int getBadgeCount() {
    return getNotificationRequest().optInt(BADGE_KEY);
  }
}
