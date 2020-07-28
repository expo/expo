package expo.modules.notifications.notifications.categories;

import android.content.Context;
import android.os.Bundle;
import android.os.ResultReceiver;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.MapArguments;
import org.unimodules.core.errors.InvalidArgumentException;
import org.unimodules.core.interfaces.ExpoMethod;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;

import expo.modules.notifications.notifications.NotificationSerializer;
import expo.modules.notifications.notifications.model.NotificationAction;
import expo.modules.notifications.notifications.model.NotificationCategory;
import expo.modules.notifications.notifications.model.TextInputNotificationAction;
import expo.modules.notifications.notifications.service.BaseNotificationsService;

public class ExpoNotificationCategoriesModule extends ExportedModule {
  private static final String EXPORTED_NAME = "ExpoNotificationCategoriesModule";
  private static final String IDENTIFIER_KEY = "identifier";
  private static final String BUTTON_TITLE_KEY = "buttonTitle";
  private static final String OPTIONS_KEY = "options";
  private static final String OPENS_APP_TO_FOREGROUND_KEY = "opensAppToForeground";
  private static final String TEXT_INPUT_OPTIONS_KEY = "textInput";
  private static final String SUBMIT_BUTTON_TITLE_KEY = "submitButtonTitle";
  private static final String PLACEHOLDER_KEY = "placeholder";

  public ExpoNotificationCategoriesModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }

  @ExpoMethod
  public void getNotificationCategoriesAsync(final Promise promise) {
    BaseNotificationsService.enqueueGetCategories(getContext(), new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        Collection<NotificationCategory> categories = resultData.getParcelableArrayList(BaseNotificationsService.CATEGORIES_KEY);
        if (resultCode == BaseNotificationsService.SUCCESS_CODE && categories != null) {
          promise.resolve(serializeCategories(categories));
        } else {
          Exception e = resultData.getParcelable(BaseNotificationsService.EXCEPTION_KEY);
          promise.reject("ERR_CATEGORIES_FETCH_FAILED", "A list of notification categories could not be fetched.", e);
        }
      }
    });
  }

  @ExpoMethod
  public void setNotificationCategoryAsync(final String identifier, List<HashMap<String, Object>> actionArguments, HashMap<String, Object> categoryOptions, final Promise promise) {
    List<NotificationAction> actions = new ArrayList();
    for (HashMap<String, Object> actionMap : actionArguments) {
      MapArguments actionParams = new MapArguments(actionMap);
      MapArguments actionOptions = new MapArguments(actionParams.getMap(OPTIONS_KEY));
      MapArguments textInputOptions = actionParams.containsKey(TEXT_INPUT_OPTIONS_KEY) ? new MapArguments(actionParams.getMap(TEXT_INPUT_OPTIONS_KEY)) : null;
      if (textInputOptions != null) {
        actions.add(new TextInputNotificationAction(actionParams.getString(IDENTIFIER_KEY, null), actionParams.getString(BUTTON_TITLE_KEY, null),
                actionOptions.getBoolean(OPENS_APP_TO_FOREGROUND_KEY, true), textInputOptions.getString(SUBMIT_BUTTON_TITLE_KEY, null), textInputOptions.getString(PLACEHOLDER_KEY, null)));
      } else {
        actions.add(new NotificationAction(actionParams.getString(IDENTIFIER_KEY, null), actionParams.getString(BUTTON_TITLE_KEY, null), actionOptions.getBoolean(OPENS_APP_TO_FOREGROUND_KEY, true)));
      }
    }

    if (actions.isEmpty()) {
      throw new InvalidArgumentException("Invalid arguments provided for notification category. Must provide at least one action.");
    }
    BaseNotificationsService.enqueueSetCategory(getContext(), new NotificationCategory(identifier, actions), new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        NotificationCategory newCategory = resultData.getParcelable(BaseNotificationsService.CATEGORIES_KEY);
        if (newCategory != null) {
          promise.resolve(NotificationSerializer.toBundle(newCategory));
        } else {
          promise.reject("ERR_CATEGORY_SET_FAILED", "The provided category could not be set.");
        }
      }
    });
  }

  @ExpoMethod
  public void deleteNotificationCategoryAsync(String identifier, final Promise promise) {
    BaseNotificationsService.enqueueDeleteCategory(getContext(), identifier, new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        boolean success = resultData.getByte(BaseNotificationsService.CATEGORIES_KEY) != 0;
        promise.resolve(success);
      }
    });
  }

  protected ArrayList<Bundle> serializeCategories(Collection<NotificationCategory> categories) {
    ArrayList<Bundle> serializedCategories = new ArrayList<>();
    for (NotificationCategory category : categories) {
      serializedCategories.add(NotificationSerializer.toBundle(category));
    }
    return serializedCategories;
  }

}
