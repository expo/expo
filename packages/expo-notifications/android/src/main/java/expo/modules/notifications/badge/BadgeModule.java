package expo.modules.notifications.badge;

import android.content.Context;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;

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
