package expo.modules.notifications.badge;

import android.content.Context;

import expo.modules.core.ExportedModule;
import expo.modules.core.ModuleRegistry;
import expo.modules.core.Promise;
import expo.modules.core.interfaces.ExpoMethod;

import expo.modules.notifications.badge.interfaces.BadgeManager;

public class BadgeModule extends ExportedModule {
  private static final String EXPORTED_NAME = "ExpoBadgeModule";

  private BadgeManager mBadgeManager;

  public BadgeModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mBadgeManager = moduleRegistry.getSingletonModule("BadgeManager", BadgeManager.class);
  }

  @ExpoMethod
  public void getBadgeCountAsync(Promise promise) {
    promise.resolve(mBadgeManager.getBadgeCount());
  }

  @ExpoMethod
  public void setBadgeCountAsync(int badgeCount, Promise promise) {
    promise.resolve(mBadgeManager.setBadgeCount(badgeCount));
  }
}
