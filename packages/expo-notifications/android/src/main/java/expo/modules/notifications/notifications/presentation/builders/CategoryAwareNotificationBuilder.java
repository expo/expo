package expo.modules.notifications.notifications.presentation.builders;

import androidx.core.app.RemoteInput;
import androidx.core.app.NotificationCompat;
import android.app.PendingIntent;
import android.content.Context;
import android.util.Log;

import java.util.ArrayList;
import java.util.List;
import java.io.IOException;

import expo.modules.notifications.notifications.model.NotificationAction;
import expo.modules.notifications.notifications.model.NotificationCategory;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.TextInputNotificationAction;
import expo.modules.notifications.notifications.service.TextInputNotificationResponseReceiver;
import expo.modules.notifications.notifications.service.SharedPreferencesNotificationCategoriesStore;
import static expo.modules.notifications.notifications.service.NotificationResponseReceiver.getActionIntent;
import static expo.modules.notifications.notifications.service.TextInputNotificationResponseReceiver.getActionIntent;

public class CategoryAwareNotificationBuilder extends ExpoNotificationBuilder {
  private SharedPreferencesNotificationCategoriesStore mStore;

  public CategoryAwareNotificationBuilder(Context context) {
    super(context);
    mStore = new SharedPreferencesNotificationCategoriesStore(context);
  }

  @Override
  protected NotificationCompat.Builder createBuilder() {
    NotificationCompat.Builder builder = super.createBuilder();

    NotificationContent content = getNotificationContent();
    
    String categoryIdentifer = content.getCategoryId();
    if (categoryIdentifer != null) {
      List<NotificationAction> actions = new ArrayList();
      try {
        NotificationCategory category = mStore.getNotificationCategory(categoryIdentifer);
        if (category != null) {
          actions = category.getActions();
        }
      } catch (ClassNotFoundException | IOException e) {
        Log.e("expo-notifications", String.format("Could not read category with identifer: %s. %s", categoryIdentifer, e.getMessage()));
        e.printStackTrace();
      }
      for (NotificationAction action : actions) {
        if (action instanceof TextInputNotificationAction) {
          builder.addAction(buildTextInputAction((TextInputNotificationAction)action));
        } else {
          builder.addAction(buildButtonAction(action));
        }
      }
    }

    return builder;
  }

  private NotificationCompat.Action buildButtonAction(NotificationAction action) {
    PendingIntent intent = getActionIntent(getContext(), action, getNotification());
    return new NotificationCompat.Action.Builder(super.getIcon(), action.getTitle(), intent).build();
  }

  private NotificationCompat.Action buildTextInputAction(TextInputNotificationAction action) {
    PendingIntent intent = getActionIntent(getContext(), action, getNotification());
    RemoteInput remoteInput = new RemoteInput.Builder(TextInputNotificationResponseReceiver.USER_TEXT_RESPONSE)
      .setLabel(action.getPlaceholder())
      .build();

    return new NotificationCompat.Action.Builder(super.getIcon(), action.getSubmitButtonTitle(), intent).addRemoteInput(remoteInput).build();
  }
}