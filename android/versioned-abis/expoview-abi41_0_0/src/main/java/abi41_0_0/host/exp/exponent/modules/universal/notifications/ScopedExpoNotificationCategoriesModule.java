package abi41_0_0.host.exp.exponent.modules.universal.notifications;

import android.content.Context;
import android.os.Bundle;
import android.os.ResultReceiver;

import abi41_0_0.org.unimodules.core.Promise;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;

import androidx.annotation.NonNull;
import abi41_0_0.expo.modules.notifications.notifications.categories.ExpoNotificationCategoriesModule;
import expo.modules.notifications.notifications.model.NotificationCategory;
import abi41_0_0.expo.modules.notifications.service.NotificationsService;
import host.exp.exponent.kernel.ExperienceKey;
import abi41_0_0.host.exp.exponent.modules.api.notifications.ScopedNotificationsIdUtils;

import static abi41_0_0.expo.modules.notifications.service.NotificationsService.NOTIFICATION_CATEGORIES_KEY;
import static abi41_0_0.expo.modules.notifications.service.NotificationsService.SUCCESS_CODE;

public class ScopedExpoNotificationCategoriesModule extends ExpoNotificationCategoriesModule {
  private final ExperienceKey mExperienceKey;

  public ScopedExpoNotificationCategoriesModule(Context context, @NonNull ExperienceKey experienceKey) {
    super(context);
    mExperienceKey = experienceKey;
  }

  @Override
  public void getNotificationCategoriesAsync(final Promise promise) {
    NotificationsService.Companion.getCategories(getContext(), new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        Collection<NotificationCategory> categories = resultData.getParcelableArrayList(NOTIFICATION_CATEGORIES_KEY);
        if (resultCode == SUCCESS_CODE && categories != null) {
          promise.resolve(serializeScopedCategories(categories));
        } else {
          promise.reject("ERR_CATEGORIES_FETCH_FAILED", "A list of notification categories could not be fetched.");
        }
      }
    });
  }

  @Override
  public void setNotificationCategoryAsync(final String identifier, List<HashMap<String, Object>> actionArguments, HashMap<String, Object> categoryOptions, final Promise promise) {
    String scopedCategoryIdentifier = ScopedNotificationsIdUtils.getScopedCategoryId(mExperienceKey, identifier);
    super.setNotificationCategoryAsync(scopedCategoryIdentifier, actionArguments, categoryOptions, promise);
  }

  @Override
  public void deleteNotificationCategoryAsync(String identifier, final Promise promise) {
    String scopedCategoryIdentifier = ScopedNotificationsIdUtils.getScopedCategoryId(mExperienceKey, identifier);
    super.deleteNotificationCategoryAsync(scopedCategoryIdentifier, promise);
  }

  protected ArrayList<Bundle> serializeScopedCategories(@NonNull Collection<NotificationCategory> categories) {
    ArrayList<Bundle> serializedCategories = new ArrayList<>();
    for (NotificationCategory category : categories) {
      if (ScopedNotificationsIdUtils.checkIfCategoryBelongsToExperience(mExperienceKey, category)) {
        serializedCategories.add(mSerializer.toBundle(category));
      }
    }
    return serializedCategories;
  }
}
