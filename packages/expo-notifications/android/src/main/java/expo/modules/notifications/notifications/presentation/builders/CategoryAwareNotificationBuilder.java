package expo.modules.notifications.notifications.presentation.builders;

import android.app.PendingIntent;
import android.content.Context;
import android.util.Log;
import androidx.annotation.NonNull;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

import androidx.core.app.NotificationCompat;
import androidx.core.app.RemoteInput;
import expo.modules.notifications.notifications.model.NotificationAction;
import expo.modules.notifications.notifications.model.NotificationCategory;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.TextInputNotificationAction;
import expo.modules.notifications.notifications.service.SharedPreferencesNotificationCategoriesStore;
import expo.modules.notifications.notifications.service.TextInputNotificationResponseReceiver;

import static expo.modules.notifications.notifications.service.TextInputNotificationResponseReceiver.getActionIntent;

public class CategoryAwareNotificationBuilder extends ExpoNotificationBuilder {
  protected SharedPreferencesNotificationCategoriesStore mStore;

  public CategoryAwareNotificationBuilder(Context context, @NonNull SharedPreferencesNotificationCategoriesStore store) {
    super(context);
    mStore = store;
  }

  @Override
  protected NotificationCompat.Builder createBuilder() {
    NotificationCompat.Builder builder = super.createBuilder();

    NotificationContent content = getNotificationContent();
    
    String categoryIdentifier = content.getCategoryId();
    if (categoryIdentifier != null) {
      List<NotificationAction> actions = Collections.emptyList();
      try {
        NotificationCategory category = mStore.getNotificationCategory(categoryIdentifier);
        if (category != null) {
          actions = category.getActions();
        }
      } catch (ClassNotFoundException | IOException e) {
        Log.e("expo-notifications", String.format("Could not read category with identifier: %s. %s", categoryIdentifier, e.getMessage()));
        e.printStackTrace();
      }
      for (NotificationAction action : actions) {
        if (action instanceof TextInputNotificationAction) {
          builder.addAction(buildTextInputAction((TextInputNotificationAction) action));
        } else {
          builder.addAction(buildButtonAction(action));
        }
      }
    }

    return builder;
  }

  protected NotificationCompat.Action buildButtonAction(@NonNull NotificationAction action) {
    PendingIntent intent = getActionIntent(getContext(), action, getNotification());
    return new NotificationCompat.Action.Builder(super.getIcon(), action.getTitle(), intent).build();
  }

  protected NotificationCompat.Action buildTextInputAction(@NonNull TextInputNotificationAction action) {
    PendingIntent intent = getActionIntent(getContext(), action, getNotification());
    RemoteInput remoteInput = new RemoteInput.Builder(TextInputNotificationResponseReceiver.USER_TEXT_RESPONSE)
      .setLabel(action.getPlaceholder())
      .build();

    return new NotificationCompat.Action.Builder(super.getIcon(), action.getTitle(), intent).addRemoteInput(remoteInput).build();
  }
}
