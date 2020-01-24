package expo.modules.notifications.notifications.presentation.effects;

import android.app.Notification;
import android.content.Context;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.presentation.ExpoNotificationBuilder;
import me.leolin.shortcutbadger.ShortcutBadger;

public class SetBadgeCountNotificationEffect extends BaseNotificationEffect {
  public static final String EXTRAS_BADGE_KEY = ExpoNotificationBuilder.EXTRAS_BADGE_KEY;

  public SetBadgeCountNotificationEffect(Context context) {
    super(context);
  }

  @Override
  public boolean onNotificationPresented(@Nullable String tag, int id, Notification notification) {
    return applyBadgeFromNotification(notification);
  }

  @Override
  public boolean onNotificationPresentationFailed(@Nullable String tag, int id, Notification notification) {
    // We could also just return false here. Then, notifications that failed to be presented
    // wouldn't affect badge count. Applying badge count from failed notifications lets us
    // properly handle badge-update-only notifications.
    return applyBadgeFromNotification(notification);
  }

  private boolean applyBadgeFromNotification(Notification notification) {
    if (notification.extras.get(EXTRAS_BADGE_KEY) != null) {
      ShortcutBadger.applyCount(getContext().getApplicationContext(), notification.extras.getInt(EXTRAS_BADGE_KEY));
      return true;
    }
    return false;
  }
}
