package versioned.host.exp.exponent.modules.universal.notifications;

import android.content.Context;
import android.os.Bundle;
import android.os.ResultReceiver;
import androidx.annotation.NonNull;

import org.unimodules.core.Promise;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;

import expo.modules.notifications.notifications.NotificationSerializer;
import expo.modules.notifications.notifications.categories.ExpoNotificationCategoriesModule;
import expo.modules.notifications.notifications.model.NotificationCategory;
import expo.modules.notifications.notifications.service.BaseNotificationsService;
import host.exp.exponent.kernel.ExperienceId;

public class ScopedExpoNotificationCategoriesModule extends ExpoNotificationCategoriesModule {
  private String mExperienceIdString;

  public ScopedExpoNotificationCategoriesModule(Context context, @NonNull ExperienceId experienceId) {
    super(context);
    mExperienceIdString = experienceId.get();
  }
  
  @Override
  public void getNotificationCategoriesAsync(final Promise promise) {
    BaseNotificationsService.enqueueGetCategories(getContext(), new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        Collection<NotificationCategory> categories = resultData.getParcelableArrayList(BaseNotificationsService.CATEGORIES_KEY);
        if (resultCode == BaseNotificationsService.SUCCESS_CODE && categories != null) {
          promise.resolve(serializeScopedCategories(categories));
        } else {
          Exception e = resultData.getParcelable(BaseNotificationsService.EXCEPTION_KEY);
          promise.reject("ERR_CATEGORIES_FETCH_FAILED", "A list of notification categories could not be fetched.", e);
        }
      }
    });
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
