package expo.modules.notifications.notifications.categories;

import android.content.Context;
import android.os.Bundle;
import android.os.ResultReceiver;

import expo.modules.core.ExportedModule;
import expo.modules.core.ModuleRegistry;
import expo.modules.core.Promise;
import expo.modules.core.arguments.MapArguments;
import expo.modules.core.errors.InvalidArgumentException;
import expo.modules.core.interfaces.ExpoMethod;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;

import expo.modules.notifications.notifications.categories.serializers.NotificationsCategoriesSerializer;
import expo.modules.notifications.notifications.model.NotificationAction;
import expo.modules.notifications.notifications.model.NotificationCategory;
import expo.modules.notifications.notifications.model.TextInputNotificationAction;
import expo.modules.notifications.service.NotificationsService;

import static expo.modules.notifications.service.NotificationsService.NOTIFICATION_CATEGORIES_KEY;
import static expo.modules.notifications.service.NotificationsService.NOTIFICATION_CATEGORY_KEY;
import static expo.modules.notifications.service.NotificationsService.SUCCEEDED_KEY;
import static expo.modules.notifications.service.NotificationsService.SUCCESS_CODE;

public class ExpoNotificationCategoriesModule extends ExportedModule {
  private static final String EXPORTED_NAME = "ExpoNotificationCategoriesModule";
  private static final String IDENTIFIER_KEY = "identifier";
  private static final String BUTTON_TITLE_KEY = "buttonTitle";
  private static final String OPTIONS_KEY = "options";
  private static final String OPENS_APP_TO_FOREGROUND_KEY = "opensAppToForeground";
  private static final String TEXT_INPUT_OPTIONS_KEY = "textInput";
  private static final String PLACEHOLDER_KEY = "placeholder";

  protected NotificationsCategoriesSerializer mSerializer;

  public ExpoNotificationCategoriesModule(Context context) {
    super(context);
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mSerializer = moduleRegistry.getModule(NotificationsCategoriesSerializer.class);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }

  @ExpoMethod
  public void getNotificationCategoriesAsync(final Promise promise) {
    NotificationsService.Companion.getCategories(getContext(), new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        Collection<NotificationCategory> categories = resultData.getParcelableArrayList(NOTIFICATION_CATEGORIES_KEY);
        if (resultCode == SUCCESS_CODE && categories != null) {
          promise.resolve(serializeCategories(categories));
        } else {
          promise.reject("ERR_CATEGORIES_FETCH_FAILED", "A list of notification categories could not be fetched.");
        }
      }
    });
  }

  @ExpoMethod
  public void setNotificationCategoryAsync(final String identifier, List<HashMap<String, Object>> actionArguments, HashMap<String, Object> categoryOptions, final Promise promise) {
    List<NotificationAction> actions = new ArrayList();
    for (HashMap<String, Object> actionMap : actionArguments) {
      MapArguments actionParams = new MapArguments(actionMap);
      MapArguments actionOptions = new MapArguments(actionParams.getMap(OPTIONS_KEY, Collections.emptyMap()));
      MapArguments textInputOptions = actionParams.containsKey(TEXT_INPUT_OPTIONS_KEY) ? new MapArguments(actionParams.getMap(TEXT_INPUT_OPTIONS_KEY)) : null;
      if (textInputOptions != null) {
        actions.add(new TextInputNotificationAction(actionParams.getString(IDENTIFIER_KEY, null), actionParams.getString(BUTTON_TITLE_KEY, null),
          actionOptions.getBoolean(OPENS_APP_TO_FOREGROUND_KEY, true), textInputOptions.getString(PLACEHOLDER_KEY, null)));
      } else {
        actions.add(new NotificationAction(actionParams.getString(IDENTIFIER_KEY, null), actionParams.getString(BUTTON_TITLE_KEY, null), actionOptions.getBoolean(OPENS_APP_TO_FOREGROUND_KEY, true)));
      }
    }

    if (actions.isEmpty()) {
      throw new InvalidArgumentException("Invalid arguments provided for notification category. Must provide at least one action.");
    }
    NotificationsService.Companion.setCategory(getContext(), new NotificationCategory(identifier, actions), new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        NotificationCategory category = resultData.getParcelable(NOTIFICATION_CATEGORY_KEY);
        if (resultCode == SUCCESS_CODE && category != null) {
          promise.resolve(mSerializer.toBundle(category));
        } else {
          promise.reject("ERR_CATEGORY_SET_FAILED", "The provided category could not be set.");
        }
      }
    });
  }

  @ExpoMethod
  public void deleteNotificationCategoryAsync(String identifier, final Promise promise) {
    NotificationsService.Companion.deleteCategory(getContext(), identifier, new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        if (resultCode == SUCCESS_CODE) {
          promise.resolve(resultData.getBoolean(SUCCEEDED_KEY));
        } else {
          promise.reject("ERR_CATEGORY_DELETE_FAILED", "The category could not be deleted.");
        }
      }
    });
  }

  protected ArrayList<Bundle> serializeCategories(Collection<NotificationCategory> categories) {
    ArrayList<Bundle> serializedCategories = new ArrayList<>();
    for (NotificationCategory category : categories) {
      serializedCategories.add(mSerializer.toBundle(category));
    }
    return serializedCategories;
  }

}
