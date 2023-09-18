package abi47_0_0.expo.modules.notifications.badge;

import android.content.Context;

import abi47_0_0.expo.modules.core.ExportedModule;
import abi47_0_0.expo.modules.core.Promise;
import abi47_0_0.expo.modules.core.interfaces.ExpoMethod;
import expo.modules.notifications.badge.BadgeHelper;

public class BadgeModule extends ExportedModule {
  private static final String EXPORTED_NAME = "ExpoBadgeModule";

  public BadgeModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }

  @ExpoMethod
  public void getBadgeCountAsync(Promise promise) {
    promise.resolve(BadgeHelper.INSTANCE.getBadgeCount());
  }

  @ExpoMethod
  public void setBadgeCountAsync(int badgeCount, Promise promise) {
    promise.resolve(BadgeHelper.INSTANCE.setBadgeCount(getContext(), badgeCount));
  }
}
