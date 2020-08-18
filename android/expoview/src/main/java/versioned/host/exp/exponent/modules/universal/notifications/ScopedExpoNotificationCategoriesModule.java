package versioned.host.exp.exponent.modules.universal.notifications;

import android.content.Context;
import android.os.Bundle;

import org.unimodules.core.Promise;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;

import androidx.annotation.NonNull;
import expo.modules.notifications.notifications.categories.ExpoNotificationCategoriesModule;
import expo.modules.notifications.notifications.model.NotificationCategory;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.notifications.ScopedNotificationsIdUtils;

public class ScopedExpoNotificationCategoriesModule extends ExpoNotificationCategoriesModule {
  private final ExperienceId mExperienceId;

  public ScopedExpoNotificationCategoriesModule(Context context, @NonNull ExperienceId experienceId) {
    super(context);
    mExperienceId = experienceId;
  }

  @Override
  public void getNotificationCategoriesAsync(final Promise promise) {
    Collection<NotificationCategory> categories = getNotificationsHelper().getCategories();
    if (categories != null) {
      promise.resolve(serializeScopedCategories(categories));
    } else {
      promise.reject("ERR_CATEGORIES_FETCH_FAILED", "A list of notification categories could not be fetched.");
    }
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
