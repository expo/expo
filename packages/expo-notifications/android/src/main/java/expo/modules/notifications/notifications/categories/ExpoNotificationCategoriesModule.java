package expo.modules.notifications.notifications.categories;

import android.content.Context;
import android.os.Bundle;
import android.os.ResultReceiver;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.errors.InvalidArgumentException;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;

import expo.modules.notifications.notifications.NotificationSerializer;
import expo.modules.notifications.notifications.service.BaseNotificationsService;
import expo.modules.notifications.notifications.model.NotificationCategory;
import expo.modules.notifications.notifications.model.NotificationAction;
import expo.modules.notifications.notifications.model.TextInputNotificationAction;

public class ExpoNotificationCategoriesModule extends ExportedModule {
  private static final String EXPORTED_NAME = "ExpoNotificationCategoriesModule";
  private static final String IDENTIFER = "identifier";
  private static final String BUTTON_TITLE = "buttonTitle";
  private static final String OPTIONS = "options";
  private static final String OPENS_APP_TO_FOREGROUND = "opensAppToForeground";
  private static final String TEXT_INPUT_OPTIONS = "textInput";
  private static final String SUBMIT_BUTTON_TITLE = "submitButtonTitle";
  private static final String PLACEHOLDER = "placeholder";

  public ExpoNotificationCategoriesModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }

  @ExpoMethod
  public void getNotificationCategoriesAsync(final Promise promise) {
    BaseNotificationsService.enqueGetCategories(getContext(), new ResultReceiver(null) {
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
  public void setNotificationCategoryAsync(final String identifier, List<HashMap<String, Object>> actionArguments, final Promise promise) {
    List <NotificationAction> actions = new ArrayList();
    for (HashMap<String, Object> actionMap : actionArguments) {
      HashMap<String, Object> actionOptions = getActionOptions(actionMap);
      HashMap<String, Object> textInputOptions = getTextInputOptions(actionMap);
      if (textInputOptions != null) {
        actions.add(new TextInputNotificationAction(getActionIdentifier(actionMap), getActionButtonTitle(actionMap), 
          getOptionOpensAppToForeground(actionOptions), getSubmitButtonTitle(textInputOptions), getPlaceholder(textInputOptions)));
      } else {
        actions.add(new NotificationAction(getActionIdentifier(actionMap), getActionButtonTitle(actionMap), getOptionOpensAppToForeground(actionOptions)));
      }
    }

    if (actions.isEmpty()) {
      throw new InvalidArgumentException("Invalid arguments provided for notification category. Must provide at least one action.");
    }
    BaseNotificationsService.enqueSetCategory(getContext(), new NotificationCategory(identifier, actions), new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        NotificationCategory newCategory = resultData.getParcelable(BaseNotificationsService.CATEGORIES_KEY);
        promise.resolve(NotificationSerializer.toBundle(newCategory));
      }
    });
  }

  @ExpoMethod
  public void deleteNotificationCategoryAsync(String identifier, final Promise promise) {
    BaseNotificationsService.enqueDeleteCategory(getContext(), identifier, new ResultReceiver(null) {
      @Override
      protected void onReceiveResult(int resultCode, Bundle resultData) {
        super.onReceiveResult(resultCode, resultData);
        boolean success = resultData.getByte(BaseNotificationsService.CATEGORIES_KEY) != 0;
        promise.resolve(success);
      }
    });
  }

  private String getActionIdentifier(HashMap<String, Object> map) {
    Object value = map.get(IDENTIFER);
    if (value instanceof String) {
      return (String) value;
    }
    return null;
  }

  private String getActionButtonTitle(HashMap<String, Object> map) {
    Object value = map.get(BUTTON_TITLE);
    if (value instanceof String) {
      return (String) value;
    }
    return null;
  }

  private HashMap<String, Object> getTextInputOptions(HashMap<String, Object> map) {
    Object value = map.get(TEXT_INPUT_OPTIONS);
    if (value instanceof HashMap) {
      return (HashMap) value;
    }
    return null;
  }

  private HashMap<String, Object> getActionOptions(HashMap<String, Object> map) {
    Object value = map.get(OPTIONS);
    if (value instanceof HashMap) {
      return (HashMap) value;
    }
    return null;
  }

  private boolean getOptionOpensAppToForeground(HashMap<String, Object> map) {
    if (map != null) {
      Object value = map.get(OPENS_APP_TO_FOREGROUND);
      if (value instanceof Boolean) {
        return (boolean) value;
      }
    }
    return true;
  }

  protected ArrayList<Bundle> serializeCategories(Collection<NotificationCategory>  categories) {
    ArrayList<Bundle> serializedCategories = new ArrayList<>();
    for (NotificationCategory category : categories) {
      serializedCategories.add(NotificationSerializer.toBundle(category));
    }
    return serializedCategories;
  }

  private String getSubmitButtonTitle(HashMap<String, Object> map) {
    Object value = map.get(SUBMIT_BUTTON_TITLE);
    if (value instanceof String) {
      return (String) value;
    }
    return null;
  }

  private String getPlaceholder(HashMap<String, Object> map) {
    Object value = map.get(PLACEHOLDER);
    if (value instanceof String) {
      return (String) value;
    }
    return null;
  }
}
