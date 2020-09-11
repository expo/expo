package expo.modules.notifications.notifications.categories;

import android.content.Context;
import android.os.Bundle;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.MapArguments;
import org.unimodules.core.errors.InvalidArgumentException;
import org.unimodules.core.interfaces.ExpoMethod;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;

import expo.modules.notifications.notifications.NotificationSerializer;
import expo.modules.notifications.notifications.categories.serializers.NotificationsCategoriesSerializer;
import expo.modules.notifications.notifications.interfaces.NotificationsScoper;
import expo.modules.notifications.notifications.model.NotificationAction;
import expo.modules.notifications.notifications.model.NotificationCategory;
import expo.modules.notifications.notifications.model.TextInputNotificationAction;
import expo.modules.notifications.notifications.service.NotificationsHelper;

public class ExpoNotificationCategoriesModule extends ExportedModule {
  private static final String EXPORTED_NAME = "ExpoNotificationCategoriesModule";
  private static final String IDENTIFIER_KEY = "identifier";
  private static final String BUTTON_TITLE_KEY = "buttonTitle";
  private static final String OPTIONS_KEY = "options";
  private static final String OPENS_APP_TO_FOREGROUND_KEY = "opensAppToForeground";
  private static final String TEXT_INPUT_OPTIONS_KEY = "textInput";
  private static final String PLACEHOLDER_KEY = "placeholder";

  private final NotificationsHelper mNotificationsHelper;
  protected NotificationsCategoriesSerializer mSerializer;

  public ExpoNotificationCategoriesModule(Context context) {
    super(context);
    this.mNotificationsHelper = new NotificationsHelper(context, NotificationsScoper.create(context).createReconstructor());
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
    Collection<NotificationCategory> categories = getNotificationsHelper().getCategories();
    if (categories != null) {
      promise.resolve(serializeCategories(categories));
    } else {
      promise.reject("ERR_CATEGORIES_FETCH_FAILED", "A list of notification categories could not be fetched.");
    }
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
    NotificationCategory newCategory = getNotificationsHelper().setCategory(new NotificationCategory(identifier, actions));
    if (newCategory != null) {
      promise.resolve(mSerializer.toBundle(newCategory));
    } else {
      promise.reject("ERR_CATEGORY_SET_FAILED", "The provided category could not be set.");
    }
  }

  @ExpoMethod
  public void deleteNotificationCategoryAsync(String identifier, final Promise promise) {
    boolean success = getNotificationsHelper().deleteCategory(identifier);
    promise.resolve(success);
  }

  protected NotificationsHelper getNotificationsHelper() {
    return mNotificationsHelper;
  }

  protected ArrayList<Bundle> serializeCategories(Collection<NotificationCategory> categories) {
    ArrayList<Bundle> serializedCategories = new ArrayList<>();
    for (NotificationCategory category : categories) {
      serializedCategories.add(mSerializer.toBundle(category));
    }
    return serializedCategories;
  }

}
