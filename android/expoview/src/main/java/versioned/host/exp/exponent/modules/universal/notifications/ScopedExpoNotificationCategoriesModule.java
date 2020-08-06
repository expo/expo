package versioned.host.exp.exponent.modules.universal.notifications;

import android.content.Context;
import android.os.Bundle;

import org.unimodules.core.Promise;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;

import androidx.annotation.NonNull;
import expo.modules.notifications.notifications.NotificationSerializer;
import expo.modules.notifications.notifications.categories.ExpoNotificationCategoriesModule;
import expo.modules.notifications.notifications.model.NotificationCategory;
import host.exp.exponent.kernel.ExperienceId;

public class ScopedExpoNotificationCategoriesModule extends ExpoNotificationCategoriesModule {
  private final String mExperienceIdString;

  public ScopedExpoNotificationCategoriesModule(Context context, @NonNull ExperienceId experienceId) {
    super(context);
    mExperienceIdString = experienceId.get();
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
    String scopedCategoryIdentifier = String.format("%s-%s", mExperienceIdString, identifier);
    super.setNotificationCategoryAsync(scopedCategoryIdentifier, actionArguments, categoryOptions, promise);
  }

  @Override
  public void deleteNotificationCategoryAsync(String identifier, final Promise promise) {
    String scopedCategoryIdentifier = String.format("%s-%s", mExperienceIdString, identifier);
    super.deleteNotificationCategoryAsync(scopedCategoryIdentifier, promise);
  }

  protected ArrayList<Bundle> serializeScopedCategories(@NonNull Collection<NotificationCategory> categories) {
    ArrayList<Bundle> serializedCategories = new ArrayList<>();
    for (NotificationCategory category : categories) {
      if (category.getIdentifier().startsWith(mExperienceIdString + "-")) {
        serializedCategories.add(NotificationSerializer.toBundle(category));
      }
    }
    return serializedCategories;
  }
}
