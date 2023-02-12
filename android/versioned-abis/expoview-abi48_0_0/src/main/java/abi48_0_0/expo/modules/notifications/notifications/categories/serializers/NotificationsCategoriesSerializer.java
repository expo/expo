package abi48_0_0.expo.modules.notifications.notifications.categories.serializers;

import android.os.Bundle;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.model.NotificationCategory;

public interface NotificationsCategoriesSerializer {
  @Nullable
  Bundle toBundle(@Nullable NotificationCategory category);
}
