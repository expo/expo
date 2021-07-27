package expo.modules.notifications.notifications.categories.serializers;

import android.os.Bundle;

import expo.modules.core.interfaces.InternalModule;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.model.NotificationAction;
import expo.modules.notifications.notifications.model.NotificationCategory;
import expo.modules.notifications.notifications.model.TextInputNotificationAction;

public class ExpoNotificationsCategoriesSerializer implements NotificationsCategoriesSerializer, InternalModule {
  @Override
  public List<? extends Class> getExportedInterfaces() {
    return Collections.singletonList(NotificationsCategoriesSerializer.class);
  }

  @Nullable
  @Override
  public Bundle toBundle(@Nullable NotificationCategory category) {
    if (category == null) {
      return null;
    }
    Bundle serializedCategory = new Bundle();
    serializedCategory.putString("identifier", getIdentifier(category));
    serializedCategory.putParcelableArrayList("actions", toBundleList(category.getActions()));
    // Android doesn't support any category options
    serializedCategory.putBundle("options", new Bundle());
    return serializedCategory;
  }

  protected String getIdentifier(@NonNull NotificationCategory category) {
    return category.getIdentifier();
  }

  private ArrayList<Bundle> toBundleList(List<NotificationAction> actions) {
    ArrayList<Bundle> result = new ArrayList<>();
    for (NotificationAction action : actions) {
      result.add(toBundle(action));
    }
    return result;
  }

  private Bundle toBundle(NotificationAction action) {
    // First we bundle up the options
    Bundle serializedActionOptions = new Bundle();
    serializedActionOptions.putBoolean("opensAppToForeground", action.opensAppToForeground());

    Bundle serializedAction = new Bundle();
    serializedAction.putString("identifier", action.getIdentifier());
    serializedAction.putString("buttonTitle", action.getTitle());
    serializedAction.putBundle("options", serializedActionOptions);

    if (action instanceof TextInputNotificationAction) {
      Bundle serializedTextInputOptions = new Bundle();
      serializedTextInputOptions.putString("placeholder", ((TextInputNotificationAction) action).getPlaceholder());
      serializedAction.putBundle("textInput", serializedTextInputOptions);
    }

    return serializedAction;
  }
}
