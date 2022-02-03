package expo.modules.notifications.badge;

import android.content.Context;
import android.util.Log;

import expo.modules.core.interfaces.SingletonModule;

import expo.modules.notifications.badge.interfaces.BadgeManager;
import me.leolin.shortcutbadger.ShortcutBadgeException;
import me.leolin.shortcutbadger.ShortcutBadger;

public class ExpoBadgeManager implements SingletonModule, BadgeManager {
  private static final String SINGLETON_NAME = "BadgeManager";

  private int mBadgeCount = 0;
  private Context mContext;

  public ExpoBadgeManager(Context context) {
    mContext = context;
  }

  @Override
  public String getName() {
    return SINGLETON_NAME;
  }

  @Override
  public int getBadgeCount() {
    return mBadgeCount;
  }

  @Override
  public boolean setBadgeCount(int badgeCount) {
    try {
      ShortcutBadger.applyCountOrThrow(mContext.getApplicationContext(), badgeCount);
      mBadgeCount = badgeCount;
      return true;
    } catch (ShortcutBadgeException e) {
      Log.d("expo-notifications", "Could not have set badge count: " + e.getMessage());
      e.printStackTrace();
    }
    return false;
  }
}
