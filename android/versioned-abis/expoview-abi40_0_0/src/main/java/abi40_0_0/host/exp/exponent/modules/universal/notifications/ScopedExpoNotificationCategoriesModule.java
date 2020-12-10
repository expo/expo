package abi40_0_0.host.exp.exponent.modules.universal.notifications;

import android.content.Context;
import android.os.Bundle;
import android.os.ResultReceiver;

import abi40_0_0.org.unimodules.core.Promise;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;

import androidx.annotation.NonNull;
import abi40_0_0.expo.modules.notifications.notifications.categories.ExpoNotificationCategoriesModule;
import expo.modules.notifications.notifications.model.NotificationCategory;
import abi40_0_0.expo.modules.notifications.service.NotificationsService;
import host.exp.exponent.kernel.ExperienceId;
import abi40_0_0.host.exp.exponent.modules.api.notifications.ScopedNotificationsIdUtils;

import static abi40_0_0.expo.modules.notifications.service.NotificationsService.NOTIFICATION_CATEGORIES_KEY;
import static abi40_0_0.expo.modules.notifications.service.NotificationsService.SUCCESS_CODE;

public class ScopedExpoNotificationCategoriesModule extends ExpoNotificationCategoriesModule {
  private final ExperienceId mExperienceId;

  public ScopedExpoNotificationCategoriesModule(Context context, @NonNull ExperienceId experienceId) {
    super(context);
    mExperienceId = experienceId;
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
    String scopedCategoryIdentifier = ScopedNotificationsIdUtils.getScopedCategoryId(mExperienceId, identifier);
    super.setNotificationCategoryAsync(scopedCategoryIdentifier, actionArguments, categoryOptions, promise);
  }

  @Override
  public void deleteNotificationCategoryAsync(String identifier, final Promise promise) {
    String scopedCategoryIdentifier = ScopedNotificationsIdUtils.getScopedCategoryId(mExperienceId, identifier);
    super.deleteNotificationCategoryAsync(scopedCategoryIdentifier, promise);
  }

  protected ArrayList<Bundle> serializeScopedCategories(@NonNull Collection<NotificationCategory> categories) {
    ArrayList<Bundle> serializedCategories = new ArrayList<>();
    for (NotificationCategory category : categories) {
      if (ScopedNotificationsIdUtils.checkIfCategoryBelongsToExperience(mExperienceId, category)) {
        serializedCategories.add(mSerializer.toBundle(category));
      }
    }
    return serializedCategories;
  }
}
