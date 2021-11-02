package expo.modules.notifications.badge;

import android.app.Notification;
import android.content.Context;
import android.util.Log;

import expo.modules.core.ModuleRegistry;
import expo.modules.core.errors.CodedRuntimeException;

import androidx.annotation.Nullable;
import expo.modules.notifications.badge.interfaces.BadgeManager;
import expo.modules.notifications.notifications.presentation.builders.BadgeSettingNotificationBuilder;
import expo.modules.notifications.notifications.presentation.effects.BaseNotificationEffect;

public class SetBadgeCountNotificationEffect extends BaseNotificationEffect {
  private static final String EXTRAS_BADGE_KEY = BadgeSettingNotificationBuilder.EXTRAS_BADGE_KEY;

  private BadgeManager mBadgeManager;

  public SetBadgeCountNotificationEffect(Context context) {
    super(context);
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    super.onCreate(moduleRegistry);
    mBadgeManager = moduleRegistry.getSingletonModule("BadgeManager", BadgeManager.class);
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
    try {
      if (notification.extras.get(EXTRAS_BADGE_KEY) != null && mBadgeManager != null) {
        mBadgeManager.setBadgeCount(notification.extras.getInt(EXTRAS_BADGE_KEY));
        return true;
      }
    } catch (CodedRuntimeException e) {
      // We can't do anything but log the error and return false.
      Log.e(e.getCode(), e.getMessage());
    }

    return false;
  }
}
